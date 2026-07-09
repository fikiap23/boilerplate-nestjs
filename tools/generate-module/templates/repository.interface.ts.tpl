import { {{pascal}} } from '../entities/{{kebab}}.entity';

export interface {{pascal}}Filter {
  search?: string;
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

export interface I{{pascal}}Repository {
  create(options: {
    data: {{pascal}};
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}>;

  getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<{{pascal}} | null>;

  getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<{{pascal}}>;

  getFirst(options: {
    where: {{pascal}}Filter;
    tx?: any;
    setCache?: boolean;
  }): Promise<{{pascal}} | null>;

  getMany(options: {
    where: {{pascal}}Filter;
    tx?: any;
    setCache?: boolean;
  }): Promise<{{pascal}}[]>;

  getManyPaginate(options: {
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
  }): Promise<PaginatedResult<{{pascal}}>>;

  updateById(options: {
    id: string;
    data: {{pascal}};
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}>;

  deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: {{pascal}}) => string[]);
  }): Promise<{{pascal}}>;

  invalidateCache(options: { id?: string; tags?: string[] }): Promise<void>;
}
