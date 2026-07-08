import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { Product } from '../entities/product.entity';

export interface IProductRepository {
  create<T extends Prisma.ProductSelect>(options: {
    data: Product;
    tx?: Prisma.TransactionClient;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>>;

  getById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }> | null>;

  getThrowById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>>;

  getFirst<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }> | null>;

  getMany<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>[]>;

  getManyPaginate<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    page?: number;
    limit?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    cacheTags?: string[] | ((where?: Prisma.ProductWhereInput) => string[]);
    select?: T;
  }): Promise<{ data: Prisma.ProductGetPayload<{ select: T }>[]; meta: any }>;

  updateById<T extends Prisma.ProductSelect>(options: {
    id: string;
    data: Product;
    tx?: Prisma.TransactionClient;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>>;

  deleteById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>>;

  save(product: Product, tx?: Prisma.TransactionClient): Promise<void>;

  invalidateCache(options: { id?: string }): Promise<void>;
}
