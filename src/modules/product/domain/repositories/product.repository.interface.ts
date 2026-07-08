import { Product } from '../entities/product.entity';

export interface ProductFilter {
  search?: string;
  categoryId?: string;
  merchantId?: string;
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

export interface IProductRepository {
  create(options: { data: Product; tx?: any }): Promise<Product>;

  getById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Product | null>;

  getThrowById(options: {
    id: string;
    tx?: any;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
  }): Promise<Product>;

  getFirst(options: {
    where: ProductFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Product | null>;

  getMany(options: {
    where: ProductFilter;
    tx?: any;
    setCache?: boolean;
  }): Promise<Product[]>;

  getManyPaginate(options: {
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
  }): Promise<PaginatedResult<Product>>;

  updateById(options: {
    id: string;
    data: Product;
    tx?: any;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
  }): Promise<Product>;

  deleteById(options: { id: string; tx?: any }): Promise<Product>;

  save(product: Product, tx?: any): Promise<void>;

  invalidateCache(options: { id?: string; tags?: string[] }): Promise<void>;
}
