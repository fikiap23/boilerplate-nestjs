import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../repositories/product.repository';
import { getProductSelect } from '../../types/select-product.type';
import { FilterProductDto } from '../../presentation/dto/product.dto';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly baseRepo: ProductRepository) {}

  async create<T extends Prisma.ProductSelect>(options: {
    data: Product;
    tx?: Prisma.TransactionClient;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>> {
    return this.baseRepo.create({
      tx: options.tx,
      data: options.data.toPrismaCreate(),
      tags: CacheTags.merchant(options.data.getMerchantId()),
      select: options.select,
    });
  }

  async getById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }> | null> {
    return this.baseRepo.getById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: options.select,
    } as any);
  }

  async getThrowById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    lock?: { mode: 'noKeyUpdate' | 'update' | 'share' | 'keyShare' };
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>> {
    return this.baseRepo.getThrowById({
      id: options.id,
      tx: options.tx,
      ...(options.lock
        ? { lock: options.lock }
        : { setCache: options.setCache }),
      select: options.select,
    } as any);
  }

  async getFirst<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }> | null> {
    return this.baseRepo.getFirst({
      where: options.where,
      tx: options.tx,
      setCache: options.setCache,
      select: options.select,
    });
  }

  async getMany<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>[]> {
    return this.baseRepo.getMany({
      where: options.where,
      tx: options.tx,
      setCache: options.setCache,
      select: options.select,
    });
  }

  async getManyPaginate<T extends Prisma.ProductSelect>(options: {
    where: Prisma.ProductWhereInput;
    page?: number;
    limit?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    tx?: Prisma.TransactionClient;
    setCache?: boolean;
    cacheTags?: string[] | ((where?: Prisma.ProductWhereInput) => string[]);
    select?: T;
  }): Promise<{ data: Prisma.ProductGetPayload<{ select: T }>[]; meta: any }> {
    return this.baseRepo.getManyPaginate({
      where: options.where,
      page: options.page,
      limit: options.limit,
      orderBy: options.orderBy,
      tx: options.tx,
      select: options.select,
      setCache: options.setCache,
      cacheTags: options.cacheTags,
    });
  }

  async updateById<T extends Prisma.ProductSelect>(options: {
    id: string;
    data: Product;
    tx?: Prisma.TransactionClient;
    invalidate?: 'all' | 'entity' | 'queries' | 'none';
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>> {
    return this.baseRepo.updateById({
      id: options.id,
      tx: options.tx,
      data: options.data.toPrismaUpdate(),
      tags: (result: any) => CacheTags.merchant(result.merchantId),
      invalidate: options.invalidate,
      select: options.select,
    });
  }

  async deleteById<T extends Prisma.ProductSelect>(options: {
    id: string;
    tx?: Prisma.TransactionClient;
    select?: T;
  }): Promise<Prisma.ProductGetPayload<{ select: T }>> {
    return this.baseRepo.deleteById({
      id: options.id,
      tx: options.tx,
      tags: (result: any) => CacheTags.merchant(result.merchantId),
      select: options.select,
    });
  }

  async save(product: Product, tx?: Prisma.TransactionClient): Promise<void> {
    const id = product.getId();

    // Check existence to decide create vs update
    const exists = id
      ? await this.baseRepo.getFirst({
          tx,
          where: { id },
          select: { id: true },
        })
      : null;

    if (exists && id) {
      await this.baseRepo.updateById({
        tx,
        id,
        data: product.toPrismaUpdate(),
        tags: (result) => CacheTags.merchant(result.merchantId),
        invalidate: tx ? 'none' : 'all',
      });
    } else {
      const created = await this.baseRepo.create({
        tx,
        data: product.toPrismaCreate(),
        tags: CacheTags.merchant(product.getMerchantId()),
        invalidate: tx ? 'none' : 'queries',
      });
      product.setId(created.id);
    }
  }

  async invalidateCache(options: { id?: string }): Promise<void> {
    await this.baseRepo.invalidateCache(options);
  }
}
