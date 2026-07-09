import { Injectable } from '@nestjs/common';
import { CategoryClient } from '../../client/category.client';
import { CategoryClientResponse } from '../../client/category.response';
import { GetCategoryByIdUseCase } from '../use-cases/get-category-by-id.use-case';
import { GetCategoryManyIdsUseCase } from '../use-cases/get-category-many-ids.use-case';

@Injectable()
export class CategoryClientImpl implements CategoryClient {
  constructor(
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getCategoryManyIdsUseCase: GetCategoryManyIdsUseCase,
  ) {}

  async getCategory(id: string): Promise<CategoryClientResponse | null> {
    try {
      const category = await this.getCategoryByIdUseCase.execute(id);
      if (!category) return null;
      return {
        id: category.getId(),
        name: category.getName(),
        slug: category.getSlug(),
      };
    } catch {
      return null;
    }
  }

  async getCategoriesByIds(ids: string[]): Promise<CategoryClientResponse[]> {
    try {
      const categories = await this.getCategoryManyIdsUseCase.execute(ids);
      return categories.map((category) => ({
        id: category.getId(),
        name: category.getName(),
        slug: category.getSlug(),
      }));
    } catch {
      return [];
    }
  }
}
