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
  getTags?: (entity: any) => string[];
}

export type InvalidateMode = 'all' | 'entity' | 'queries' | 'none';
