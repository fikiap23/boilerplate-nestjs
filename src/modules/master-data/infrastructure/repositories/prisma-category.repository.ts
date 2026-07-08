import { Injectable } from '@nestjs/common';
import {
  ICategoryRepository,
  CategoryFilter,
  PaginatedResult,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../repositories/category.repository';
import { getCategorySelect } from '../../types/select-category.type';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly baseRepo: CategoryRepository) {}

  async create(options: {
    data: Category;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category> {
    const raw = await this.baseRepo.create({
      tx: options.tx,
      data: CategoryMapper.toPersistenceCreate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Category) => string[])(
                CategoryMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getCategorySelect('general'),
    });
    return CategoryMapper.toDomain(raw);
  }

  async getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Category | null> {
    const raw = await this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getCategorySelect('general'),
    } as any);
    return CategoryMapper.toDomain(raw);
  }

  async getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Category> {
    const raw = await this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getCategorySelect('general'),
    } as any);
    return CategoryMapper.toDomain(raw);
  }

  async getFirst(options: {
    where: CategoryFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Category | null> {
    const raw = await this.baseRepo.getFirst({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getCategorySelect('general'),
    });
    return CategoryMapper.toDomain(raw);
  }

  async getMany(options: {
    where: CategoryFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Category[]> {
    const raws = await this.baseRepo.getMany({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getCategorySelect('general'),
    });
    return raws.map((raw) => CategoryMapper.toDomain(raw));
  }

  async getManyPaginate(options: {
    where: CategoryFilter;
    page?: number;
    limit?: number;
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'name' | 'slug';
      sort: 'asc' | 'desc';
    };
    tx?: any;
    setCache?: boolean;
    cacheTags?: string[];
  }): Promise<PaginatedResult<Category>> {
    const orderByObj = options.orderBy
      ? { [options.orderBy.field]: options.orderBy.sort }
      : undefined;

    const result = await this.baseRepo.getManyPaginate({
      where: options.where as any,
      page: options.page,
      limit: options.limit,
      orderBy: orderByObj,
      tx: options.tx,
      select: getCategorySelect('general'),
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });

    return {
      data: result.data.map((raw) => CategoryMapper.toDomain(raw)),
      meta: result.meta,
    };
  }

  async updateById(options: {
    id: string;
    data: Category;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category> {
    const raw = await this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: CategoryMapper.toPersistenceUpdate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Category) => string[])(
                CategoryMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getCategorySelect('general'),
    });
    return CategoryMapper.toDomain(raw);
  }

  async deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category> {
    const raw = await this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Category) => string[])(
                CategoryMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getCategorySelect('general'),
    });
    return CategoryMapper.toDomain(raw);
  }

  async invalidateCache(options: {
    id?: string;
    tags?: string[];
  }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
