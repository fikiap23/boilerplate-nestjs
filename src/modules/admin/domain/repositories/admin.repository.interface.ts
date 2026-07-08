import { Admin } from '../entities/admin.entity';

export interface AdminFilter {
  search?: string;
  role?: string;
  status?: string;
  email?: string;
  id?: any;
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

export interface IAdminRepository {
  create(options: {
    data: Admin;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin>;

  getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    select?: any;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Admin | null>;

  getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    select?: any;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Admin>;

  getFirst(options: {
    where: AdminFilter;
    tx?: any;
    select?: any;
    setCache?: boolean;
  }): Promise<Admin | null>;

  getMany(options: {
    where: AdminFilter;
    tx?: any;
    select?: any;
    setCache?: boolean;
  }): Promise<Admin[]>;

  getManyPaginate(options: {
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
  }): Promise<PaginatedResult<Admin>>;

  updateById(options: {
    id: string;
    data: any; // We support partial update object or domain object
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin>;

  deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Admin) => string[]);
  }): Promise<Admin>;

  invalidateCache(options: { id?: string; tags?: string[] }): Promise<void>;
}
