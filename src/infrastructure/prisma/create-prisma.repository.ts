import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginateFunction, paginator } from 'prisma/paginator/paginator';
import { IPaginatedResult } from 'prisma/interfaces/paginated-result';
import { PrismaService } from './prisma.service';
import { PrismaModelDelegate } from './types/prisma-delegate.type';
import { InferRepositoryPayload } from './types/infer-repository-payload.type';
import { RedisService } from '../redis/redis.service';
import { RepositoryCacheOptions } from '../redis/types/repository-cache-options.type';
import {
  buildEntityKey,
  buildQueryKey,
  entityIndexKey,
  queryIndexKey,
} from '../redis/utils/cache-key.util';

const paginate: PaginateFunction = paginator({});

const NULL_SENTINEL = '__NULL__';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

export function createPrismaRepository<
  TSelect extends object,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderBy,
  TToPayload extends <T extends TSelect>(data: unknown) => unknown,
>(options: {
  model?: string;
  cache?: RepositoryCacheOptions;
  getDelegate: (client: PrismaClientLike) => PrismaModelDelegate;
  toPayload: TToPayload;
}) {
  type Payload<T extends TSelect> = InferRepositoryPayload<
    TSelect,
    T,
    TToPayload
  >;

  const cacheEnabled = options.cache?.enabled === true && !!options.model;
  const cacheTtl = options.cache?.ttl ?? 300;
  const cacheNullTtl = options.cache?.nullTtl ?? 60;
  const modelName = options.model ?? '';

  const getModel = (prisma: PrismaService, tx?: Prisma.TransactionClient) =>
    options.getDelegate(tx ?? prisma);

  // --- cache helpers (closure-scoped to avoid TS4094 on anonymous class) ---

  function canCache(redis?: RedisService): redis is RedisService {
    return cacheEnabled && !!redis;
  }

  function getPrefix(redis: RedisService): string {
    return redis.getPrefix();
  }

  async function cacheGetEntity<T extends TSelect>(
    redis: RedisService,
    id: string,
    method: string,
    select?: T,
  ): Promise<{ hit: true; data: Payload<T> | null } | { hit: false }> {
    const key = buildEntityKey({ prefix: getPrefix(redis), model: modelName, id, method, select });
    const raw = await redis.get<unknown>(key);
    if (raw === null) return { hit: false };
    if (raw === NULL_SENTINEL) return { hit: true, data: null };
    return { hit: true, data: options.toPayload<T>(raw) as Payload<T> };
  }

  async function cacheSetEntity<T extends TSelect>(
    redis: RedisService,
    id: string,
    method: string,
    result: unknown,
    select?: T,
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const key = buildEntityKey({ prefix, model: modelName, id, method, select });
    const isNull = result === null || result === undefined;
    await redis.set(key, isNull ? NULL_SENTINEL : result, isNull ? cacheNullTtl : cacheTtl);
    await redis.sadd(entityIndexKey(prefix, modelName, id), key);
  }

  async function cacheGetQuery<TResult>(
    redis: RedisService,
    method: string,
    params: Record<string, unknown>,
  ): Promise<{ hit: true; data: TResult } | { hit: false }> {
    const key = buildQueryKey({ prefix: getPrefix(redis), model: modelName, method, params });
    const raw = await redis.get<TResult>(key);
    if (raw === null) return { hit: false };
    return { hit: true, data: raw };
  }

  async function cacheSetQuery(
    redis: RedisService,
    method: string,
    params: Record<string, unknown>,
    result: unknown,
  ): Promise<void> {
    const prefix = getPrefix(redis);
    const key = buildQueryKey({ prefix, model: modelName, method, params });
    await redis.set(key, result, cacheTtl);
    await redis.sadd(queryIndexKey(prefix, modelName), key);
  }

  async function doInvalidateEntity(redis: RedisService, id: string): Promise<void> {
    await redis.invalidateByIndex(entityIndexKey(getPrefix(redis), modelName, id));
  }

  async function doInvalidateQueries(redis: RedisService): Promise<void> {
    await redis.invalidateByIndex(queryIndexKey(getPrefix(redis), modelName));
  }

  @Injectable()
  class PrismaRepository {
    constructor(
      public readonly prisma: PrismaService,
      @Optional() @Inject(RedisService) public readonly redis?: RedisService,
    ) {}

    /**
     * Manual invalidation for use after prisma.execTx() completes.
     * Call with an id to invalidate entity + query caches, or without to invalidate only queries.
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
    }: {
      tx?: Prisma.TransactionClient;
      data: TCreateInput;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).create({ data, select });
      if (!tx && canCache(this.redis)) await doInvalidateQueries(this.redis);
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      if (!tx && canCache(this.redis)) {
        const cached = await cacheGetEntity<T>(this.redis, id, 'getById', select);
        if (cached.hit) return cached.data as Payload<T>;
      }
      const result = await getModel(this.prisma, tx).findUnique({
        where: { id },
        select,
      });
      if (!tx && canCache(this.redis)) await cacheSetEntity(this.redis, id, 'getById', result, select);
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getThrowById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      if (!tx && canCache(this.redis)) {
        const cached = await cacheGetEntity<T>(this.redis, id, 'getThrowById', select);
        if (cached.hit) {
          if (cached.data === null) {
            await getModel(this.prisma, tx).findUniqueOrThrow({ where: { id }, select });
          }
          return cached.data as Payload<T>;
        }
      }
      const result = await getModel(this.prisma, tx).findUniqueOrThrow({
        where: { id },
        select,
      });
      if (!tx && canCache(this.redis)) await cacheSetEntity(this.redis, id, 'getThrowById', result, select);
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getFirst<T extends TSelect>({
      tx,
      where,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
    }): Promise<Payload<T>> {
      const params = { where, select } as Record<string, unknown>;
      if (!tx && canCache(this.redis)) {
        const cached = await cacheGetQuery<unknown>(this.redis, 'getFirst', params);
        if (cached.hit) return options.toPayload<T>(cached.data) as Payload<T>;
      }
      const result = await getModel(this.prisma, tx).findFirst({ where, select });
      if (!tx && canCache(this.redis)) await cacheSetQuery(this.redis, 'getFirst', params, result);
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getMany<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      take,
      skip,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      take?: number;
      skip?: number;
    }): Promise<Payload<T>[]> {
      const params = { where, select, orderBy, take, skip } as Record<string, unknown>;
      if (!tx && canCache(this.redis)) {
        const cached = await cacheGetQuery<unknown[]>(this.redis, 'getMany', params);
        if (cached.hit) return cached.data.map((item) => options.toPayload<T>(item) as Payload<T>);
      }
      const results = await getModel(this.prisma, tx).findMany({
        where,
        select,
        orderBy,
        take,
        skip,
      });
      if (!tx && canCache(this.redis)) await cacheSetQuery(this.redis, 'getMany', params, results);
      return results.map((item) => options.toPayload<T>(item) as Payload<T>);
    }

    async getManyPaginate<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      page = 1,
      limit = 10,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      page?: number;
      limit?: number;
    }): Promise<IPaginatedResult<Payload<T>>> {
      const params = { where, select, orderBy, page, limit } as Record<string, unknown>;
      if (!tx && canCache(this.redis)) {
        const cached = await cacheGetQuery<IPaginatedResult<Payload<T>>>(this.redis, 'getManyPaginate', params);
        if (cached.hit) return cached.data;
      }
      const result = (await paginate(
        getModel(this.prisma, tx),
        { where, select, orderBy },
        { page, perPage: limit },
      )) as IPaginatedResult<Payload<T>>;
      if (!tx && canCache(this.redis)) await cacheSetQuery(this.redis, 'getManyPaginate', params, result);
      return result;
    }

    async updateById<T extends TSelect>({
      tx,
      id,
      data,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      data: TUpdateInput;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).update({
        where: { id },
        data,
        select,
      });
      if (!tx && canCache(this.redis)) {
        await doInvalidateEntity(this.redis, id);
        await doInvalidateQueries(this.redis);
      }
      return options.toPayload<T>(result) as Payload<T>;
    }

    async deleteById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).delete({
        where: { id },
        select,
      });
      if (!tx && canCache(this.redis)) {
        await doInvalidateEntity(this.redis, id);
        await doInvalidateQueries(this.redis);
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
> = InstanceType<
  ReturnType<
    typeof createPrismaRepository<
      TSelect,
      TCreateInput,
      TUpdateInput,
      TWhereInput,
      TOrderBy,
      TToPayload
    >
  >
>;
