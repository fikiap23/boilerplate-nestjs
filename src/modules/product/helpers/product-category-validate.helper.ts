import { Injectable } from '@nestjs/common';

import { CategoryRepository } from 'src/modules/master-data/repositories/category.repository';
import { getCategorySelect } from 'src/modules/master-data/types/select-category.type';

@Injectable()
export class ProductCategoryValidateHelper {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async validateCategoryExists(categoryId: string): Promise<void> {
    await this.categoryRepository.getThrowById({
      id: categoryId,
      select: getCategorySelect('minimal'),
    });
  }
}
