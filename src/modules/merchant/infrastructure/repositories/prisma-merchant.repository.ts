import { Injectable } from '@nestjs/common';
import {
  IMerchantRepository,
  MerchantFilter,
  PaginatedResult,
} from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { MerchantRepository } from '../../repositories/merchant.repository';
import { getMerchantSelect } from '../../types/select-merchant.type';
import { MerchantMapper } from '../mappers/merchant.mapper';

@Injectable()
export class PrismaMerchantRepository implements IMerchantRepository {
  constructor(private readonly baseRepo: MerchantRepository) {}

  async create(options: {
    data: Merchant;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant> {
    const raw = await this.baseRepo.create({
      tx: options.tx,
      data: MerchantMapper.toPersistenceCreate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Merchant) => string[])(
                MerchantMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getMerchantSelect('general'),
    });
    return MerchantMapper.toDomain(raw);
  }

  async getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Merchant | null> {
    const raw = await this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getMerchantSelect('general'),
    } as any);
    return MerchantMapper.toDomain(raw);
  }

  async getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Merchant> {
    const raw = await this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: getMerchantSelect('general'),
    } as any);
    return MerchantMapper.toDomain(raw);
  }

  async getFirst(options: {
    where: MerchantFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Merchant | null> {
    const raw = await this.baseRepo.getFirst({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getMerchantSelect('general'),
    });
    return MerchantMapper.toDomain(raw);
  }

  async getMany(options: {
    where: MerchantFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Merchant[]> {
    const raws = await this.baseRepo.getMany({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: getMerchantSelect('general'),
    });
    return raws.map((raw) => MerchantMapper.toDomain(raw));
  }

  async getManyPaginate(options: {
    where: MerchantFilter;
    page?: number;
    limit?: number;
    orderBy?: {
      field: 'createdAt' | 'updatedAt' | 'name' | 'slug';
      sort: 'asc' | 'desc';
    };
    tx?: any;
    setCache?: boolean;
    cacheTags?: string[];
  }): Promise<PaginatedResult<Merchant>> {
    const orderByObj = options.orderBy
      ? { [options.orderBy.field]: options.orderBy.sort }
      : undefined;

    const result = await this.baseRepo.getManyPaginate({
      where: options.where as any,
      page: options.page,
      limit: options.limit,
      orderBy: orderByObj,
      tx: options.tx,
      select: getMerchantSelect('general'),
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });

    return {
      data: result.data.map((raw) => MerchantMapper.toDomain(raw)),
      meta: result.meta,
    };
  }

  async updateById(options: {
    id: string;
    data: Merchant;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant> {
    const raw = await this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: MerchantMapper.toPersistenceUpdate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Merchant) => string[])(
                MerchantMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getMerchantSelect('general'),
    });
    return MerchantMapper.toDomain(raw);
  }

  async deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant> {
    const raw = await this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Merchant) => string[])(
                MerchantMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getMerchantSelect('general'),
    });
    return MerchantMapper.toDomain(raw);
  }

  async invalidateCache(options: {
    id?: string;
    tags?: string[];
  }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
