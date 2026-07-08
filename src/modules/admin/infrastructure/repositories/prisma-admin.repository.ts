import { Injectable } from '@nestjs/common';
import {
  IAdminRepository,
  AdminFilter,
  PaginatedResult,
} from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { AdminRepository } from '../../repositories/admin.repository';
import { getAdminSelect } from '../../types/select-admin.type';
import { AdminMapper } from '../mappers/admin.mapper';

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly baseRepo: AdminRepository) {}

  async create(options: {
    data: Admin;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin> {
    const raw = await this.baseRepo.create({
      tx: options.tx,
      data: AdminMapper.toPersistenceCreate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Admin) => string[])(
                AdminMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getAdminSelect('general'),
    });
    return AdminMapper.toDomain(raw);
  }

  async getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    select?: any;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Admin | null> {
    const raw = await this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: options.select ?? getAdminSelect('general'),
    } as any);
    return AdminMapper.toDomain(raw);
  }

  async getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    select?: any;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Admin> {
    const raw = await this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: options.select ?? getAdminSelect('general'),
    } as any);
    return AdminMapper.toDomain(raw);
  }

  async getFirst(options: {
    where: AdminFilter;
    tx?: any;
    select?: any;
    setCache?: boolean;
  }): Promise<Admin | null> {
    const raw = await this.baseRepo.getFirst({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: options.select ?? getAdminSelect('general'),
    });
    return AdminMapper.toDomain(raw);
  }

  async getMany(options: {
    where: AdminFilter;
    tx?: any;
    select?: any;
    setCache?: boolean;
  }): Promise<Admin[]> {
    const raws = await this.baseRepo.getMany({
      where: options.where as any,
      tx: options.tx,
      setCache: options.setCache,
      select: options.select ?? getAdminSelect('general'),
    });
    return raws.map((raw) => AdminMapper.toDomain(raw));
  }

  async getManyPaginate(options: {
    where: AdminFilter;
    page?: number;
    limit?: number;
    orderBy?: {
      field: 'createdAt' | 'lastLoginAt' | 'name' | 'email';
      sort: 'asc' | 'desc';
    };
    tx?: any;
    select?: any;
    setCache?: boolean;
    cacheTags?: string[];
  }): Promise<PaginatedResult<Admin>> {
    const orderByObj = options.orderBy
      ? { [options.orderBy.field]: options.orderBy.sort }
      : undefined;

    const result = await this.baseRepo.getManyPaginate({
      where: options.where as any,
      page: options.page,
      limit: options.limit,
      orderBy: orderByObj,
      tx: options.tx,
      select: options.select ?? getAdminSelect('general'),
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });

    return {
      data: result.data.map((raw) => AdminMapper.toDomain(raw)),
      meta: result.meta,
    };
  }

  async updateById(options: {
    id: string;
    data: any;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin> {
    const raw = await this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: AdminMapper.toPersistenceUpdate(options.data),
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Admin) => string[])(
                AdminMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getAdminSelect('general'),
    });
    return AdminMapper.toDomain(raw);
  }

  async deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin> {
    const raw = await this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      invalidate: options.invalidate,
      tags:
        typeof options.tags === 'function'
          ? (rawResult: any) =>
              (options.tags as (res: Admin) => string[])(
                AdminMapper.toDomain(rawResult),
              )
          : options.tags,
      select: getAdminSelect('general'),
    });
    return AdminMapper.toDomain(raw);
  }

  async invalidateCache(options: {
    id?: string;
    tags?: string[];
  }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
