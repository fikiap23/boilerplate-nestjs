import { Merchant } from '../../domain/entities/merchant.entity';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export class MerchantMapper {
  static toDomain(raw: any): Merchant {
    if (!raw) return null;
    return new Merchant({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistenceCreate(domain: Merchant): Prisma.MerchantCreateInput {
    return {
      id: domain.getId() || undefined,
      name: domain.getName(),
      slug: domain.getSlug(),
    };
  }

  static toPersistenceUpdate(domain: Merchant): Prisma.MerchantUpdateInput {
    return {
      name: domain.getName(),
      slug: domain.getSlug(),
    };
  }
}
