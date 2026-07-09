import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { CategoryRepository } from '../../repositories/category.repository';
import { getCategorySelect } from '../../types/select-category.type';

@Injectable()
export class CategorySlugValidatePolicy {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const bySlug = await this.categoryRepository.getFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: getCategorySelect('minimal'),
    });

    if (bySlug) {
      throw new CustomError({
        statusCode: 409,
        message: 'Category slug already exists',
      });
    }
  }
}
