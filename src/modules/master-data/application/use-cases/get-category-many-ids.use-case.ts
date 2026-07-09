import { Inject, Injectable } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class GetCategoryManyIdsUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(ids: string[]): Promise<Category[]> {
    return await this.categoryRepository.getMany({
      where: { id: { in: ids } },
      setCache: true,
    });
  }
}
