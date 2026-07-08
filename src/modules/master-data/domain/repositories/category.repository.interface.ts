import { Category } from '../entities/category.entity';

export interface CategoryFilter {
  search?: string;
  slug?: string;
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

export interface ICategoryRepository {
  create(options: {
    data: Category;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category>;

  getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Category | null>;

  getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Category>;

  getFirst(options: {
    where: CategoryFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Category | null>;

  getMany(options: {
    where: CategoryFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Category[]>;

  getManyPaginate(options: {
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
  }): Promise<PaginatedResult<Category>>;

  updateById(options: {
    id: string;
    data: Category;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category>;

  deleteById(options: {
    id: string;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    tags?: string[] | ((result: Category) => string[]);
  }): Promise<Category>;

  invalidateCache(options: { id?: string; tags?: string[] }): Promise<void>;
}
