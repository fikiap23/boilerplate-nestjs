import { Injectable } from '@nestjs/common';

import { CategoryRepository } from 'src/modules/master-data/repositories/category.repository';
import { getCategorySelect } from 'src/modules/master-data/types/select-category.type';

@Injectable()
export class ProductCategoryComposeHelper {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async composeOne<T extends { categoryId: string }>(product: T) {
    const category = await this.categoryRepository.getThrowById({
      id: product.categoryId,
      select: getCategorySelect('general'),
      setCache: true,
    });

    return { ...product, category };
  }

  async composeMany<T extends { categoryId: string }>(products: T[]) {
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];

    const categories = categoryIds.length
      ? await this.categoryRepository.getMany({
          where: { id: { in: categoryIds } },
          select: getCategorySelect('general'),
          setCache: true,
        })
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return products.map((p) => ({
      ...p,
      category: categoryMap.get(p.categoryId) ?? null,
    }));
  }
}
