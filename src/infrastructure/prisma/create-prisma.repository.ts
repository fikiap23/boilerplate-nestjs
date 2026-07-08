import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { PaginateFunction, paginator } from 'prisma/paginator/paginator';
import { splitSelect } from 'src/common/utils/helper.common';
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
import { validateCacheConfig } from './utils/validate-cache-config.util';
import { recordCacheDebug } from '../redis/utils/cache-debug.util';

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
  scalarFields?: Record<string, string>;
  composeHelperToken?: any;
}) {
  type Payload<T extends TSelect> = [TRepoModel] extends [never]
    ? InferRepositoryPayload<TSelect, T, TToPayload>
    : PrismaSelectPayload<TRepoModel & keyof PrismaSelectPayloadMap, T>;

  const cacheConfigured = !!options.model && !!options.cache;
  const defaultTtl = options.cache?.ttl ?? 300;
  const defaultNullTtl = options.cache?.nullTtl ?? 60;
  const modelName = options.model ?? '';
  const sensitiveFields = options.cache?.sensitiveFields ?? ['password'];
  const methodConfig = options.cache?.methods ?? {};
  const lockConfig = options.lock;

  if (lockConfig) {
    validateLockConfig(lockConfig);
  }

  if (cacheConfigured) {
    validateCacheConfig(modelName);
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

  function canUseRedis(redis?: RedisService): redis is RedisService {
    return !!redis && redis.isReady();
  }

  function canInvalidate(redis?: RedisService): redis is RedisService {
    return cacheConfigured && canUseRedis(redis);
  }

  function shouldCache(
    method: CacheMethod,
    setCache?: boolean,
    tx?: Prisma.TransactionClient,
    select?: object,
  ): boolean {
    if (setCache !== true) return false;
    if (!cacheConfigured) return false;
    if (tx) return false;
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
    tags?: string[],
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const key = buildQueryKey({ prefix, model: modelName, method, params });
    const isNull = result === null || result === undefined;
    const ttl = applyJitter(isNull ? defaultNullTtl : getMethodTtl(method));

    if (tags && tags.length > 0) {
      await redis.safeSet(key, isNull ? NULL_SENTINEL : result, ttl);
      await registerQueryWithTags(redis, key, ttl, tags);
    } else {
      const idxKey = queryIndexKey(prefix, modelName);
      await redis.safeSetWithIndex(
        key,
        isNull ? NULL_SENTINEL : result,
        ttl,
        idxKey,
      );
    }
    await releaseLock(redis, key);
  }

  async function registerQueryWithTags(
    redis: RedisService,
    key: string,
    ttlSeconds: number,
    tags: string[],
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const globalIdxKey = queryIndexKey(prefix, modelName);

    const promises = tags.map((tag) => {
      const idxKey = `${prefix}:repo:${modelName}:t:${tag}:__idx`;
      return redis.safeSaddAndExpire(idxKey, [key], ttlSeconds);
    });

    promises.push(redis.safeSaddAndExpire(globalIdxKey, [key], ttlSeconds));
    await Promise.all(promises);
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

  async function doInvalidateTags(
    redis: RedisService,
    tags: string[],
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const keysToDelete: string[] = [];
    const idxKeysToDelete: string[] = [];

    await Promise.all(
      tags.map(async (tag) => {
        const idxKey = `${prefix}:repo:${modelName}:t:${tag}:__idx`;
        const keys = await redis.safeSmembers(idxKey);
        if (keys.length > 0) {
          keysToDelete.push(...keys);
        }
        idxKeysToDelete.push(idxKey);
      }),
    );

    if (keysToDelete.length > 0) {
      await redis.safeDel(...new Set(keysToDelete), ...idxKeysToDelete);
    } else if (idxKeysToDelete.length > 0) {
      await redis.safeDel(...idxKeysToDelete);
    }
  }

  async function runInvalidation(
    redis: RedisService,
    mode: InvalidateMode,
    id?: string,
    tags?: string[],
  ): Promise<void> {
    if (tags && tags.length > 0) {
      if (id) await doInvalidateEntity(redis, id);
      await doInvalidateTags(redis, tags);
      return;
    }

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

  function resolveTags(where: any, cacheTags: any): string[] | undefined {
    if (cacheTags) {
      return typeof cacheTags === 'function' ? cacheTags(where) : cacheTags;
    }
    if (options.cache?.getTags && where) {
      try {
        return options.cache.getTags(where);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  const DUMMY_COMPOSE_TOKEN = 'DUMMY_COMPOSE_TOKEN';

  @Injectable()
  class PrismaRepository {
    constructor(
      public readonly prisma: PrismaService,
      @Optional() @Inject(RedisService) public readonly redis?: RedisService,
      @Optional()
      @Inject(options.composeHelperToken || DUMMY_COMPOSE_TOKEN)
      public readonly composeHelper?: any,
    ) {}

    async processSelectAndCompose(
      select: any,
      queryFn: (dbSelect: any) => Promise<any>,
    ): Promise<any> {
      if (!select || !options.scalarFields) {
        return queryFn(select);
      }

      const { dbSelect, relations } = splitSelect(select, options.scalarFields);
      const result = await queryFn(dbSelect);

      if (this.composeHelper && result && Object.keys(relations).length > 0) {
        if (result.data && Array.isArray(result.data)) {
          result.data = await this.composeHelper.composeMany(
            result.data,
            relations,
          );
        } else if (Array.isArray(result)) {
          return this.composeHelper.composeMany(result, relations);
        } else {
          return this.composeHelper.composeOne(result, relations);
        }
      }

      return result;
    }

    /**
     * Manual invalidation for use after prisma.execTx() completes.
     */
    async invalidateCache(opts?: { id?: string }): Promise<void> {
      if (!canInvalidate(this.redis)) return;
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
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const result = await getModel(this.prisma, tx).create({
          data,
          select: dbSelect,
        });
        if (!tx && canInvalidate(this.redis)) {
          const tags = options.cache?.getTags
            ? options.cache.getTags(result)
            : undefined;
          await runInvalidation(this.redis, invalidate, undefined, tags);
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
    }

    async getById<T extends TSelect>({
      tx,
      id,
      select,
      setCache,
      lock,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
      setCache?: boolean;
      lock?: RowLockOptions;
    }): Promise<Payload<T>> {
      return this.processSelectAndCompose(select, async (dbSelect) => {
        if (lock) {
          assertLockPrerequisites(tx, lockConfig);
          const result = await queryRowForUpdate(tx, lockConfig, {
            id,
            select: dbSelect,
            lock,
          });
          return options.toPayload<T>(result) as Payload<T>;
        }

        const useCache =
          shouldCache('getById', setCache, tx, dbSelect) &&
          canUseRedis(this.redis);

        if (useCache) {
          const cached = await cacheGetEntity<T>(
            this.redis,
            id,
            'getById',
            dbSelect,
          );
          if (cached.hit) {
            recordCacheDebug('getById', 'HIT', modelName);
            return cached.data as Payload<T>;
          }
          recordCacheDebug('getById', 'MISS', modelName);
        } else if (setCache === true && !cacheConfigured) {
          recordCacheDebug('getById', 'BYPASS', 'repo not configured');
        } else if (
          setCache === true &&
          selectIncludesSensitiveField(dbSelect, sensitiveFields)
        ) {
          recordCacheDebug('getById', 'BYPASS', 'sensitive select');
        }

        const result = await getModel(this.prisma, tx).findUnique({
          where: { id },
          select: dbSelect,
        });
        if (useCache) {
          await cacheSetEntity(this.redis, id, 'getById', result, dbSelect);
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
    }

    async getThrowById<T extends TSelect>({
      tx,
      id,
      select,
      setCache,
      lock,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
      setCache?: boolean;
      lock?: RowLockOptions;
    }): Promise<Payload<T>> {
      return this.processSelectAndCompose(select, async (dbSelect) => {
        if (lock) {
          assertLockPrerequisites(tx, lockConfig);
          const result = await queryRowForUpdate(tx, lockConfig, {
            id,
            select: dbSelect,
            lock,
          });
          if (result === null) {
            await getModel(this.prisma, tx).findUniqueOrThrow({
              where: { id },
              select: dbSelect,
            });
          }
          return options.toPayload<T>(result) as Payload<T>;
        }

        const useCache =
          shouldCache('getThrowById', setCache, tx, dbSelect) &&
          canUseRedis(this.redis);

        if (useCache) {
          const cached = await cacheGetEntity<T>(
            this.redis,
            id,
            'getThrowById',
            dbSelect,
          );
          if (cached.hit) {
            recordCacheDebug('getThrowById', 'HIT', modelName);
            if (cached.data === null) {
              await getModel(this.prisma, tx).findUniqueOrThrow({
                where: { id },
                select: dbSelect,
              });
            }
            return cached.data as Payload<T>;
          }
          recordCacheDebug('getThrowById', 'MISS', modelName);
        } else if (setCache === true && !cacheConfigured) {
          recordCacheDebug('getThrowById', 'BYPASS', 'repo not configured');
        }

        const result = await getModel(this.prisma, tx).findUniqueOrThrow({
          where: { id },
          select: dbSelect,
        });
        if (useCache) {
          await cacheSetEntity(
            this.redis,
            id,
            'getThrowById',
            result,
            dbSelect,
          );
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
    }

    async getFirst<T extends TSelect>({
      tx,
      where,
      select,
      setCache,
      cacheTags,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      setCache?: boolean;
      cacheTags?: string[] | ((where?: TWhereInput) => string[]);
    }): Promise<Payload<T>> {
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const params = { where, select: dbSelect } as Record<string, unknown>;
        const useCache =
          shouldCache('getFirst', setCache, tx, dbSelect) &&
          canUseRedis(this.redis);

        if (useCache) {
          const cached = await cacheGetQuery<unknown>(
            this.redis,
            'getFirst',
            params,
          );
          if (cached.hit) {
            recordCacheDebug('getFirst', 'HIT', modelName);
            return options.toPayload<T>(cached.data) as Payload<T>;
          }
          recordCacheDebug('getFirst', 'MISS', modelName);
        }

        const result = await getModel(this.prisma, tx).findFirst({
          where,
          select: dbSelect,
        });
        if (useCache) {
          const resolvedTags = resolveTags(where, cacheTags);
          await cacheSetQuery(
            this.redis,
            'getFirst',
            params,
            result,
            resolvedTags,
          );
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
    }

    async getMany<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      take,
      skip,
      setCache,
      cacheTags,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      take?: number;
      skip?: number;
      setCache?: boolean;
      cacheTags?: string[] | ((where?: TWhereInput) => string[]);
    }): Promise<Payload<T>[]> {
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const params = {
          where,
          select: dbSelect,
          orderBy,
          take,
          skip,
        } as Record<string, unknown>;
        const useCache =
          shouldCache('getMany', setCache, tx, dbSelect) &&
          canUseRedis(this.redis);

        if (useCache) {
          const cached = await cacheGetQuery<unknown[]>(
            this.redis,
            'getMany',
            params,
          );
          if (cached.hit) {
            recordCacheDebug('getMany', 'HIT', modelName);
            return cached.data!.map(
              (item) => options.toPayload<T>(item) as Payload<T>,
            );
          }
          recordCacheDebug('getMany', 'MISS', modelName);
        }

        const results = await getModel(this.prisma, tx).findMany({
          where,
          select: dbSelect,
          orderBy,
          take,
          skip,
        });
        if (useCache) {
          const resolvedTags = resolveTags(where, cacheTags);
          await cacheSetQuery(
            this.redis,
            'getMany',
            params,
            results,
            resolvedTags,
          );
        }
        return results.map((item) => options.toPayload<T>(item) as Payload<T>);
      });
    }

    async getManyPaginate<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      page = 1,
      limit = 10,
      setCache,
      cacheTags,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      page?: number;
      limit?: number;
      setCache?: boolean;
      cacheTags?: string[] | ((where?: TWhereInput) => string[]);
    }): Promise<IPaginatedResult<Payload<T>>> {
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const params = {
          where,
          select: dbSelect,
          orderBy,
          page,
          limit,
        } as Record<string, unknown>;
        const useCache =
          shouldCache('getManyPaginate', setCache, tx, dbSelect) &&
          canUseRedis(this.redis);

        if (useCache) {
          const cached = await cacheGetQuery<IPaginatedResult<Payload<T>>>(
            this.redis,
            'getManyPaginate',
            params,
          );
          if (cached.hit) {
            recordCacheDebug('getManyPaginate', 'HIT', modelName);
            return cached.data as IPaginatedResult<Payload<T>>;
          }
          recordCacheDebug('getManyPaginate', 'MISS', modelName);
        }

        const result = (await paginate(
          getModel(this.prisma, tx),
          { where, select: dbSelect, orderBy },
          { page, perPage: limit },
        )) as IPaginatedResult<Payload<T>>;
        if (useCache) {
          const resolvedTags = resolveTags(where, cacheTags);
          await cacheSetQuery(
            this.redis,
            'getManyPaginate',
            params,
            result,
            resolvedTags,
          );
        }
        return result;
      });
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
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const result = await getModel(this.prisma, tx).update({
          where: { id },
          data,
          select: dbSelect,
        });
        if (!tx && canInvalidate(this.redis)) {
          const tags = options.cache?.getTags
            ? options.cache.getTags(result)
            : undefined;
          await runInvalidation(this.redis, invalidate, id, tags);
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
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
      return this.processSelectAndCompose(select, async (dbSelect) => {
        const result = await getModel(this.prisma, tx).delete({
          where: { id },
          select: dbSelect,
        });
        if (!tx && canInvalidate(this.redis)) {
          const tags = options.cache?.getTags
            ? options.cache.getTags(result)
            : undefined;
          await runInvalidation(this.redis, invalidate, id, tags);
        }
        return options.toPayload<T>(result) as Payload<T>;
      });
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
