import { Inject, Injectable } from '@nestjs/common';
import { CategorySlugValidatePolicy } from '../../domain/policies/category-slug-validate.policy';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto } from '../../presentation/dto/category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly categorySlugValidatePolicy: CategorySlugValidatePolicy,
  ) {}

  async execute(dto: CreateCategoryDto): Promise<Category> {
    await this.categorySlugValidatePolicy.assertSlugAvailable(dto.slug);

    const category = new Category({
      name: dto.name,
      slug: dto.slug,
    });

    return await this.categoryRepository.create({
      data: category,
    });
  }
}
