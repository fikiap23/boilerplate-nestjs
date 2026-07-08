import { Injectable } from '@nestjs/common';
import {
  IProductRepository,
  ProductFilter,
  PaginatedResult,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../repositories/product.repository';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { getProductSelect } from '../../types/select-product.type';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly baseRepo: ProductRepository) {}

  async create(options: {
    data: Product;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Product) => string[]);
  }): Promise<Product> {
    const raw = await this.baseRepo.create({
      tx: options.tx,
      data: ProductMapper.toPersistenceCreate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Product) => string[])(
                ProductMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getProductSelect('general'),
    });
    return ProductMapper.toDomain(raw);
  }

  async getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Product | null> {
    const raw = await this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getProductSelect('general'),
    } as any);
    return ProductMapper.toDomain(raw);
  }

  async getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Product> {
    const raw = await this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getProductSelect('general'),
    } as any);
    return ProductMapper.toDomain(raw);
  }

  async getFirst(options: {
    where: ProductFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Product | null> {
    const raw = await this.baseRepo.getFirst({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getProductSelect('general'),
    });
    return ProductMapper.toDomain(raw);
  }

  async getMany(options: {
    where: ProductFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Product[]> {
    const raws = await this.baseRepo.getMany({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getProductSelect('general'),
    });
    return raws.map((raw) => ProductMapper.toDomain(raw));
  }

  async getManyPaginate(options: {
    where: ProductFilter;
    page?: number;
    limit?: number;
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'name' | 'price';
      sort: 'asc' | 'desc';
    };
    tx?: any;
    setCache?: boolean;
    cacheTags?: string[];
  }): Promise<PaginatedResult<Product>> {
    const orderByObj = options.orderBy
      ? { [options.orderBy.field]: options.orderBy.sort }
      : undefined;

    const result = await this.baseRepo.getManyPaginate({
      where: options.where as any,
      page: options.page,
      limit: options.limit,
      orderBy: orderByObj,
      tx: options.tx,
      select: getProductSelect('general'),
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });

    return {
      data: result.data.map((raw) => ProductMapper.toDomain(raw)),
      meta: result.meta,
    };
  }

  async updateById(options: {
    id: string;
    data: Product;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Product) => string[]);
  }): Promise<Product> {
    const raw = await this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: ProductMapper.toPersistenceUpdate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Product) => string[])(
                ProductMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getProductSelect('general'),
    });
    return ProductMapper.toDomain(raw);
  }

  async deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Product) => string[]);
  }): Promise<Product> {
    const raw = await this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Product) => string[])(
                ProductMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getProductSelect('general'),
    });
    return ProductMapper.toDomain(raw);
  }

  async save(product: Product, tx?: any): Promise<void> {
    const id = product.getId();

    const exists = id
      ? await this.baseRepo.getFirst({
          tx,
          where: { id },
          select: { id: true },
        })
      : null;

    if (exists && id) {
      await this.baseRepo.updateById({
        tx,
        id,
        data: ProductMapper.toPersistenceUpdate(product),
        invalidate: tx ? 'none' : 'all',
        tags: (result: any) => CacheTags.merchant(result.merchantId),
        select: { id: true },
      });
    } else {
      const created = await this.baseRepo.create({
        tx,
        data: ProductMapper.toPersistenceCreate(product),
        invalidate: tx ? 'none' : 'queries',
        tags: CacheTags.merchant(product.getMerchantId()),
        select: { id: true },
      });
      product.setId(created.id);
    }
  }

  async invalidateCache(options: {
    id?: string;
    tags?: string[];
  }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
