import { Inject, Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class DeleteCategoryByIdUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<Category> {
    await this.categoryRepository.getThrowById({ id });
    return await this.categoryRepository.deleteById({ id });
  }
}
