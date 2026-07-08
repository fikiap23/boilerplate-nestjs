import { Category } from '../../domain/entities/category.entity';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export class CategoryMapper {
  static toDomain(raw: any): Category {
    if (!raw) return null;
    return new Category({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistenceCreate(domain: Category): Prisma.CategoryCreateInput {
    return {
      id: domain.getId() || undefined,
      name: domain.getName(),
      slug: domain.getSlug(),
    };
  }

  static toPersistenceUpdate(domain: Category): Prisma.CategoryUpdateInput {
    return {
      name: domain.getName(),
      slug: domain.getSlug(),
    };
  }
}
