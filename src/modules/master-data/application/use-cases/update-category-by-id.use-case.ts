import { Inject, Injectable } from '@nestjs/common';
import { CategorySlugValidatePolicy } from '../../domain/policies/category-slug-validate.policy';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { UpdateCategoryDto } from '../../presentation/dto/category.dto';

@Injectable()
export class UpdateCategoryByIdUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly categorySlugValidatePolicy: CategorySlugValidatePolicy,
  ) {}

  async execute(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.getThrowById({
      id,
    });

    if (dto.slug && dto.slug !== category.getSlug()) {
      await this.categorySlugValidatePolicy.assertSlugAvailable(
        dto.slug,
        category.getId(),
      );
    }

    category.updateDetails(dto.name, dto.slug);

    return await this.categoryRepository.updateById({
      id,
      data: category,
    });
  }
}
