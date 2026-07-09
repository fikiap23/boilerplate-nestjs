import { Inject, Injectable } from '@nestjs/common';

import { CategorySlugValidateHelper } from '../../helpers/category-slug-validate.helper';
import {
  ICategoryRepository,
  PaginatedResult,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import {
  CreateCategoryDto,
  FilterCategoryDto,
  UpdateCategoryDto,
} from '../../presentation/dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly categorySlugValidateHelper: CategorySlugValidateHelper,
  ) {}

  async handleCreate(dto: CreateCategoryDto): Promise<Category> {
    await this.categorySlugValidateHelper.assertSlugAvailable(dto.slug);

    const category = new Category({
      name: dto.name,
      slug: dto.slug,
    });

    return await this.categoryRepository.create({
      data: category,
    });
  }

  async handleGetById(id: string): Promise<Category> {
    return await this.categoryRepository.getThrowById({
      id,
      setCache: true,
    });
  }

  async handleGetManyPaginate(
    dto: FilterCategoryDto,
  ): Promise<PaginatedResult<Category>> {
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

  async handleUpdateById(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.getThrowById({
      id,
    });

    if (dto.slug && dto.slug !== category.getSlug()) {
      await this.categorySlugValidateHelper.assertSlugAvailable(
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

  async handleDeleteById(id: string): Promise<Category> {
    await this.categoryRepository.getThrowById({ id });
    return await this.categoryRepository.deleteById({ id });
  }

  async handleGetManyByIds(ids: string[]): Promise<Category[]> {
    return await this.categoryRepository.getMany({
      where: { id: { in: ids } },
      setCache: true,
    });
  }
}
