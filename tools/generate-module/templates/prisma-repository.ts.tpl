import { Injectable } from '@nestjs/common';
import {
  I{{pascal}}Repository,
  {{pascal}}Filter,
  PaginatedResult,
} from '../../domain/repositories/{{kebab}}.repository.interface';
import { {{pascal}} } from '../../domain/entities/{{kebab}}.entity';
import { {{pascal}}Repository } from '../../repositories/{{kebab}}.repository';
import { get{{pascal}}Select } from '../../types/select-{{kebab}}.type';
import { {{pascal}}Mapper } from '../mappers/{{kebab}}.mapper';

@Injectable()
export class Prisma{{pascal}}Repository implements I{{pascal}}Repository {
  constructor(private readonly baseRepo: {{pascal}}Repository) {}

  async create(options: {
    data: {{pascal}};
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}> {
    const raw = await this.baseRepo.create({
      tx: options.tx,
      data: {{pascal}}Mapper.toPersistenceCreate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: {{pascal}}) => string[])(
                {{pascal}}Mapper.toDomain(rawResult),
              )
          : options.tags,
      select: get{{pascal}}Select('general'),
    });
    return {{pascal}}Mapper.toDomain(raw);
  }

  async getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<{{pascal}} | null> {
    const raw = await this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: get{{pascal}}Select('general'),
    } as any);
    return {{pascal}}Mapper.toDomain(raw);
  }

  async getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<{{pascal}}> {
    const raw = await this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: get{{pascal}}Select('general'),
    } as any);
    return {{pascal}}Mapper.toDomain(raw);
  }

  async getFirst(options: {
    where: {{pascal}}Filter;
    tx?: any;
    setCache?: boolean;
  }): Promise<{{pascal}} | null> {
    const raw = await this.baseRepo.getFirst({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: get{{pascal}}Select('general'),
    });
    return {{pascal}}Mapper.toDomain(raw);
  }

  async getMany(options: {
    where: {{pascal}}Filter;
    tx?: any;
    setCache?: boolean;
  }): Promise<{{pascal}}[]> {
    const raws = await this.baseRepo.getMany({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: get{{pascal}}Select('general'),
    });
    return raws.map((raw) => {{pascal}}Mapper.toDomain(raw));
  }

  async getManyPaginate(options: {
    where: {{pascal}}Filter;
    page?: number;
    limit?: number;
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'name';
      sort: 'asc' | 'desc';
    };
    tx?: any;
    setCache?: boolean;
    cacheTags?: string[];
  }): Promise<PaginatedResult<{{pascal}}>> {
    const orderByObj = options.orderBy
      ? { [options.orderBy.field]: options.orderBy.sort }
      : undefined;

    const result = await this.baseRepo.getManyPaginate({
      where: options.where as any,
      page: options.page,
      limit: options.limit,
      orderBy: orderByObj,
      tx: options.tx,
      select: get{{pascal}}Select('general'),
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });

    return {
      data: result.data.map((raw) => {{pascal}}Mapper.toDomain(raw)),
      meta: result.meta,
    };
  }

  async updateById(options: {
    id: string;
    data: {{pascal}};
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}> {
    const raw = await this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: {{pascal}}Mapper.toPersistenceUpdate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: {{pascal}}) => string[])(
                {{pascal}}Mapper.toDomain(rawResult),
              )
          : options.tags,
      select: get{{pascal}}Select('general'),
    });
    return {{pascal}}Mapper.toDomain(raw);
  }

  async deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}> {
    const raw = await this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: {{pascal}}) => string[])(
                {{pascal}}Mapper.toDomain(rawResult),
              )
          : options.tags,
      select: get{{pascal}}Select('general'),
    });
    return {{pascal}}Mapper.toDomain(raw);
  }

  async invalidateCache(options: {
    id?: string;
    tags?: string[];
  }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
