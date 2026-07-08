import { Merchant } from '../entities/merchant.entity';

export interface MerchantFilter {
  search?: string;
  slug?: string;
  id?: any; // To allow { not: current.id } etc
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}

export interface IMerchantRepository {
  create(options: {
    data: Merchant;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant>;

  getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Merchant | null>;

  getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Merchant>;

  getFirst(options: {
    where: MerchantFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Merchant | null>;

  getMany(options: {
    where: MerchantFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Merchant[]>;

  getManyPaginate(options: {
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
  }): Promise<PaginatedResult<Merchant>>;

  updateById(options: {
    id: string;
    data: Merchant;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant>;

  deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Merchant) => string[]);
  }): Promise<Merchant>;

  invalidateCache(options: { id?: string; tags?: string[] }): Promise<void>;
}
