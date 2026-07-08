export type CacheMethod =
  | 'getById'
  | 'getThrowById'
  | 'getFirst'
  | 'getMany'
  | 'getManyPaginate';

export interface RepositoryCacheOptions {
  ttl?: number;
  nullTtl?: number;
  sensitiveFields?: string[];
  methods?: Partial<Record<CacheMethod, { enabled?: boolean; ttl?: number }>>;
}

export type InvalidateMode = 'all' | 'entity' | 'queries' | 'none';
