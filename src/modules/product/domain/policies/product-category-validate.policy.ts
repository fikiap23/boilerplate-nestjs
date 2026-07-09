import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { CategoryClient } from 'src/modules/master-data/client/category.client';

@Injectable()
export class ProductCategoryValidatePolicy {
  constructor(private readonly categoryClient: CategoryClient) {}

  async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryClient.getCategory(categoryId);
    if (!category) {
      throw new CustomError({
        statusCode: 404,
        message: 'Category not found',
      });
    }
  }
}
