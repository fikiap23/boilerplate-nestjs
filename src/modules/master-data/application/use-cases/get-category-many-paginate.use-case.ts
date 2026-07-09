import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoryRepository,
  PaginatedResult,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { FilterCategoryDto } from '../../presentation/dto/category.dto';

@Injectable()
export class GetCategoryManyPaginateUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: FilterCategoryDto): Promise<PaginatedResult<Category>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
    };

    return await this.categoryRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
    });
  }
}
