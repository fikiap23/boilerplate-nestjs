import { Inject, Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<Category> {
    return await this.categoryRepository.getThrowById({
      id,
      setCache: true,
    });
  }
}
