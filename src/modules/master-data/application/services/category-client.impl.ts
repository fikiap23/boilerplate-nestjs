import { Injectable } from '@nestjs/common';
import { CategoryClient } from '../../client/category.client';
import { CategoryClientResponse } from '../../client/category.response';
import { CategoryService } from './category.service';

@Injectable()
export class CategoryClientImpl implements CategoryClient {
  constructor(private readonly categoryService: CategoryService) {}

  async getCategory(id: string): Promise<CategoryClientResponse | null> {
    try {
      const category = await this.categoryService.handleGetById(id);
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
}
