import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Stock } from '../../domain/value-objects/stock.value-object';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export class ProductMapper {
  static toDomain(raw: any): Product {
    if (!raw) return null;
    return new Product({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: new Price(Number(raw.price)),
      stock: new Stock(raw.stock),
      categoryId: raw.categoryId,
      merchantId: raw.merchantId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      category: raw.category
        ? {
            id: raw.category.id,
            name: raw.category.name,
            slug: raw.category.slug,
          }
        : undefined,
      merchant: raw.merchant
        ? {
            id: raw.merchant.id,
            name: raw.merchant.name,
            slug: raw.merchant.slug,
          }
        : undefined,
    });
  }

  static toPersistenceCreate(domain: Product): Prisma.ProductCreateInput {
    return {
      id: domain.getId() || undefined,
      name: domain.getName(),
      description: domain.getDescription(),
      price: new Prisma.Decimal(domain.getPrice().getValue()),
      stock: domain.getStock().getValue(),
      category: { connect: { id: domain.getCategoryId() } },
      merchant: { connect: { id: domain.getMerchantId() } },
    };
  }

  static toPersistenceUpdate(domain: Product): Prisma.ProductUpdateInput {
    return {
      name: domain.getName(),
      description: domain.getDescription(),
      price: new Prisma.Decimal(domain.getPrice().getValue()),
      stock: domain.getStock().getValue(),
      category: { connect: { id: domain.getCategoryId() } },
      merchant: { connect: { id: domain.getMerchantId() } },
    };
  }
}
