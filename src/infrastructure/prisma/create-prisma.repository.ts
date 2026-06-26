import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { PaginateFunction, paginator } from 'prisma/paginator/paginator';
import { IPaginatedResult } from 'prisma/interfaces/paginated-result';
import { PrismaService } from './prisma.service';
import { PrismaModelDelegate } from './types/prisma-delegate.type';
import { InferRepositoryPayload } from './types/infer-repository-payload.type';
import {
  PrismaSelectPayload,
  PrismaSelectPayloadMap,
} from './types/prisma-select-payload.type';
import { RedisService } from '../redis/redis.service';
import {
  CacheMethod,
  InvalidateMode,
  RepositoryCacheOptions,
} from '../redis/types/repository-cache-options.type';
import {
  buildEntityKey,
  buildQueryKey,
  entityIndexKey,
  queryIndexKey,
} from '../redis/utils/cache-key.util';
import { selectIncludesSensitiveField } from '../redis/utils/cache-guard.util';
import { applyJitter } from '../redis/utils/ttl-jitter.util';
import {
  RepositoryLockConfig,
  RowLockOptions,
} from './types/row-lock-options.type';
import {
  assertLockPrerequisites,
  queryRowForUpdate,
} from './utils/row-lock.util';
import { validateLockConfig } from './utils/validate-lock-config.util';

const paginate: PaginateFunction = paginator({});

const NULL_SENTINEL = '__NULL__';
const STAMPEDE_LOCK_TTL = 10;
const STAMPEDE_RETRY_MS = 50;
const STAMPEDE_MAX_RETRIES = 3;

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

export function createPrismaRepository<
  TSelect extends object,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderBy,
  TToPayload extends <T extends TSelect>(data: unknown) => unknown,
  TRepoModel extends keyof PrismaSelectPayloadMap = never,
>(options: {
  model?: TRepoModel;
  cache?: RepositoryCacheOptions;
  lock?: RepositoryLockConfig;
  getDelegate: (client: PrismaClientLike) => PrismaModelDelegate;
  toPayload: TToPayload;
}) {
  type Payload<T extends TSelect> = [TRepoModel] extends [never]
    ? InferRepositoryPayload<TSelect, T, TToPayload>
    : PrismaSelectPayload<TRepoModel & keyof PrismaSelectPayloadMap, T>;

  const cacheEnabled = options.cache?.enabled === true && !!options.model;
  const defaultTtl = options.cache?.ttl ?? 300;
  const defaultNullTtl = options.cache?.nullTtl ?? 60;
  const modelName = options.model ?? '';
  const sensitiveFields = options.cache?.sensitiveFields ?? ['password'];
  const methodConfig = options.cache?.methods ?? {};
  const lockConfig = options.lock;

  if (lockConfig) {
    validateLockConfig(lockConfig);
  }

  const getModel = (prisma: PrismaService, tx?: Prisma.TransactionClient) =>
    options.getDelegate(tx ?? prisma);

  // --- resolve per-method TTL ---

  function getMethodTtl(method: CacheMethod): number {
    return methodConfig[method]?.ttl ?? defaultTtl;
  }

  function isMethodEnabled(method: CacheMethod): boolean {
    return methodConfig[method]?.enabled !== false;
  }

  // --- cache eligibility ---

  function canCache(redis?: RedisService): redis is RedisService {
    return cacheEnabled && !!redis && redis.isReady();
  }

  function shouldCache(
    method: CacheMethod,
    tx?: Prisma.TransactionClient,
    skipCache?: boolean,
    select?: object,
  ): boolean {
    if (tx || skipCache) return false;
    if (!isMethodEnabled(method)) return false;
    if (selectIncludesSensitiveField(select, sensitiveFields)) return false;
    return true;
  }

  function getPrefix(redis: RedisService): string {
    return redis.getPrefix();
  }

  // --- stampede lock ---

  async function acquireLock(
    redis: RedisService,
    cacheKey: string,
  ): Promise<boolean> {
    return redis.safeSetNx(`${cacheKey}:lock`, STAMPEDE_LOCK_TTL);
  }

  async function releaseLock(
    redis: RedisService,
    cacheKey: string,
  ): Promise<void> {
    await redis.safeDel(`${cacheKey}:lock`);
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // --- cache get with stampede protection ---

  async function cacheGetEntity<T extends TSelect>(
    redis: RedisService,
    id: string,
    method: CacheMethod,
    select?: T,
  ): Promise<{ hit: true; data: Payload<T> | null } | { hit: false }> {
    const key = buildEntityKey({
      prefix: getPrefix(redis),
      model: modelName,
      id,
      method,
      select,
    });
    const raw = await redis.safeGet<unknown>(key);
    if (raw !== null) {
      if (raw === NULL_SENTINEL) return { hit: true, data: null };
      return { hit: true, data: options.toPayload<T>(raw) as Payload<T> };
    }
    // stampede: try lock, if someone else holds it retry GET a few times
    const locked = await acquireLock(redis, key);
    if (!locked) {
      for (let i = 0; i < STAMPEDE_MAX_RETRIES; i++) {
        await sleep(STAMPEDE_RETRY_MS);
        const retry = await redis.safeGet<unknown>(key);
        if (retry !== null) {
          if (retry === NULL_SENTINEL) return { hit: true, data: null };
          return { hit: true, data: options.toPayload<T>(retry) as Payload<T> };
        }
      }
    }
    return { hit: false };
  }

  async function cacheSetEntity<T extends TSelect>(
    redis: RedisService,
    id: string,
    method: CacheMethod,
    result: unknown,
    select?: T,
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const key = buildEntityKey({
      prefix,
      model: modelName,
      id,
      method,
      select,
    });
    const isNull = result === null || result === undefined;
    const ttl = applyJitter(isNull ? defaultNullTtl : getMethodTtl(method));
    const idxKey = entityIndexKey(prefix, modelName, id);
    await redis.safeSetWithIndex(
      key,
      isNull ? NULL_SENTINEL : result,
      ttl,
      idxKey,
    );
    await releaseLock(redis, key);
  }

  async function cacheGetQuery<TResult>(
    redis: RedisService,
    method: CacheMethod,
    params: Record<string, unknown>,
  ): Promise<{ hit: true; data: TResult | null } | { hit: false }> {
    const key = buildQueryKey({
      prefix: getPrefix(redis),
      model: modelName,
      method,
      params,
    });
    const raw = await redis.safeGet<typeof NULL_SENTINEL | TResult>(key);
    if (raw !== null) {
      if (raw === NULL_SENTINEL) return { hit: true, data: null };
      return { hit: true, data: raw };
    }
    const locked = await acquireLock(redis, key);
    if (!locked) {
      for (let i = 0; i < STAMPEDE_MAX_RETRIES; i++) {
        await sleep(STAMPEDE_RETRY_MS);
        const retry = await redis.safeGet<typeof NULL_SENTINEL | TResult>(key);
        if (retry !== null) {
          if (retry === NULL_SENTINEL) return { hit: true, data: null };
          return { hit: true, data: retry };
        }
      }
    }
    return { hit: false };
  }

  async function cacheSetQuery(
    redis: RedisService,
    method: CacheMethod,
    params: Record<string, unknown>,
    result: unknown,
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const key = buildQueryKey({ prefix, model: modelName, method, params });
    const isNull = result === null || result === undefined;
    const ttl = applyJitter(isNull ? defaultNullTtl : getMethodTtl(method));
    const idxKey = queryIndexKey(prefix, modelName);
    await redis.safeSetWithIndex(
      key,
      isNull ? NULL_SENTINEL : result,
      ttl,
      idxKey,
    );
    await releaseLock(redis, key);
  }

  async function doInvalidateEntity(
    redis: RedisService,
    id: string,
  ): Promise<void> {
    await redis.safeInvalidateByIndex(
      entityIndexKey(getPrefix(redis), modelName, id),
    );
  }

  async function doInvalidateQueries(redis: RedisService): Promise<void> {
    await redis.safeInvalidateByIndex(
      queryIndexKey(getPrefix(redis), modelName),
    );
  }

  async function runInvalidation(
    redis: RedisService,
    mode: InvalidateMode,
    id?: string,
  ): Promise<void> {
    switch (mode) {
      case 'all':
        if (id) await doInvalidateEntity(redis, id);
        await doInvalidateQueries(redis);
        break;
      case 'entity':
        if (id) await doInvalidateEntity(redis, id);
        break;
      case 'queries':
        await doInvalidateQueries(redis);
        break;
      case 'none':
        break;
    }
  }

  @Injectable()
  class PrismaRepository {
    constructor(
      public readonly prisma: PrismaService,
      @Optional() @Inject(RedisService) public readonly redis?: RedisService,
    ) {}

    /**
     * Manual invalidation for use after prisma.execTx() completes.
     */
    async invalidateCache(opts?: { id?: string }): Promise<void> {
      if (!canCache(this.redis)) return;
      if (opts?.id) await doInvalidateEntity(this.redis, opts.id);
      await doInvalidateQueries(this.redis);
    }

    async create<T extends TSelect>({
      tx,
      data,
      select,
      invalidate = 'queries',
    }: {
      tx?: Prisma.TransactionClient;
      data: TCreateInput;
      select?: T;
      invalidate?: InvalidateMode;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).create({ data, select });
      if (!tx && canCache(this.redis))
        await runInvalidation(this.redis, invalidate);
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getById<T extends TSelect>({
      tx,
      id,
      select,
      skipCache,
      lock,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
      skipCache?: boolean;
      lock?: RowLockOptions;
    }): Promise<Payload<T>> {
      if (lock) {
        assertLockPrerequisites(tx, lockConfig);
        const result = await queryRowForUpdate(tx, lockConfig, {
          id,
          select,
          lock,
        });
        return options.toPayload<T>(result) as Payload<T>;
      }

      if (
        shouldCache('getById', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        const cached = await cacheGetEntity<T>(
          this.redis,
          id,
          'getById',
          select,
        );
        if (cached.hit) return cached.data as Payload<T>;
      }
      const result = await getModel(this.prisma, tx).findUnique({
        where: { id },
        select,
      });
      if (
        shouldCache('getById', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        await cacheSetEntity(this.redis, id, 'getById', result, select);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getThrowById<T extends TSelect>({
      tx,
      id,
      select,
      skipCache,
      lock,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
      skipCache?: boolean;
      lock?: RowLockOptions;
    }): Promise<Payload<T>> {
      if (lock) {
        assertLockPrerequisites(tx, lockConfig);
        const result = await queryRowForUpdate(tx, lockConfig, {
          id,
          select,
          lock,
        });
        if (result === null) {
          await getModel(this.prisma, tx).findUniqueOrThrow({
            where: { id },
            select,
          });
        }
        return options.toPayload<T>(result) as Payload<T>;
      }

      if (
        shouldCache('getThrowById', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        const cached = await cacheGetEntity<T>(
          this.redis,
          id,
          'getThrowById',
          select,
        );
        if (cached.hit) {
          if (cached.data === null) {
            await getModel(this.prisma, tx).findUniqueOrThrow({
              where: { id },
              select,
            });
          }
          return cached.data as Payload<T>;
        }
      }
      const result = await getModel(this.prisma, tx).findUniqueOrThrow({
        where: { id },
        select,
      });
      if (
        shouldCache('getThrowById', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        await cacheSetEntity(this.redis, id, 'getThrowById', result, select);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getFirst<T extends TSelect>({
      tx,
      where,
      select,
      skipCache,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      skipCache?: boolean;
    }): Promise<Payload<T>> {
      const params = { where, select } as Record<string, unknown>;
      if (
        shouldCache('getFirst', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        const cached = await cacheGetQuery<unknown>(
          this.redis,
          'getFirst',
          params,
        );
        if (cached.hit) return options.toPayload<T>(cached.data) as Payload<T>;
      }
      const result = await getModel(this.prisma, tx).findFirst({
        where,
        select,
      });
      if (
        shouldCache('getFirst', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        await cacheSetQuery(this.redis, 'getFirst', params, result);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getMany<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      take,
      skip,
      skipCache,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      take?: number;
      skip?: number;
      skipCache?: boolean;
    }): Promise<Payload<T>[]> {
      const params = { where, select, orderBy, take, skip } as Record<
        string,
        unknown
      >;
      if (
        shouldCache('getMany', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        const cached = await cacheGetQuery<unknown[]>(
          this.redis,
          'getMany',
          params,
        );
        if (cached.hit)
          return cached.data!.map(
            (item) => options.toPayload<T>(item) as Payload<T>,
          );
      }
      const results = await getModel(this.prisma, tx).findMany({
        where,
        select,
        orderBy,
        take,
        skip,
      });
      if (
        shouldCache('getMany', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        await cacheSetQuery(this.redis, 'getMany', params, results);
      }
      return results.map((item) => options.toPayload<T>(item) as Payload<T>);
    }

    async getManyPaginate<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      page = 1,
      limit = 10,
      skipCache,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      page?: number;
      limit?: number;
      skipCache?: boolean;
    }): Promise<IPaginatedResult<Payload<T>>> {
      const params = { where, select, orderBy, page, limit } as Record<
        string,
        unknown
      >;
      if (
        shouldCache('getManyPaginate', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        const cached = await cacheGetQuery<IPaginatedResult<Payload<T>>>(
          this.redis,
          'getManyPaginate',
          params,
        );
        if (cached.hit) return cached.data as IPaginatedResult<Payload<T>>;
      }
      const result = (await paginate(
        getModel(this.prisma, tx),
        { where, select, orderBy },
        { page, perPage: limit },
      )) as IPaginatedResult<Payload<T>>;
      if (
        shouldCache('getManyPaginate', tx, skipCache, select) &&
        canCache(this.redis)
      ) {
        await cacheSetQuery(this.redis, 'getManyPaginate', params, result);
      }
      return result;
    }

    async updateById<T extends TSelect>({
      tx,
      id,
      data,
      select,
      invalidate = 'all',
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      data: TUpdateInput;
      select?: T;
      invalidate?: InvalidateMode;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).update({
        where: { id },
        data,
        select,
      });
      if (!tx && canCache(this.redis)) {
        await runInvalidation(this.redis, invalidate, id);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }

    async deleteById<T extends TSelect>({
      tx,
      id,
      select,
      invalidate = 'all',
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
      invalidate?: InvalidateMode;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).delete({
        where: { id },
        select,
      });
      if (!tx && canCache(this.redis)) {
        await runInvalidation(this.redis, invalidate, id);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }
  }

  return PrismaRepository;
}

export type PrismaRepositoryInstance<
  TSelect extends object,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderBy,
  TToPayload extends <T extends TSelect>(data: unknown) => unknown,
  TRepoModel extends keyof PrismaSelectPayloadMap = never,
> = InstanceType<
  ReturnType<
    typeof createPrismaRepository<
      TSelect,
      TCreateInput,
      TUpdateInput,
      TWhereInput,
      TOrderBy,
      TToPayload,
      TRepoModel
    >
  >
>;
