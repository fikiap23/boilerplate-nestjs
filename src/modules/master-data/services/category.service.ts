import { Injectable } from '@nestjs/common';

import { CategorySlugValidateHelper } from '../helpers/category-slug-validate.helper';
import { CategoryRepository } from '../repositories/category.repository';
import {
  CreateCategoryDto,
  FilterCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';
import { getCategorySelect } from '../types/select-category.type';
import { whereCategoryGetManyPaginate } from '../types/where-category.type';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categorySlugValidateHelper: CategorySlugValidateHelper,
  ) {}

  async handleCreate(dto: CreateCategoryDto) {
    await this.categorySlugValidateHelper.assertSlugAvailable(dto.slug);

    return await this.categoryRepository.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
      select: getCategorySelect('general'),
      tags: null,
    });
  }

  async handleGetById(id: string) {
    return await this.categoryRepository.getThrowById({
      id,
      select: getCategorySelect('general'),
      setCache: true,
    });
  }

  async handleGetManyPaginate(dto: FilterCategoryDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereCategoryGetManyPaginate(dto);

    return await this.categoryRepository.getManyPaginate({
      where,
      select: getCategorySelect('general'),
      orderBy: { createdAt: sort },
      page,
      limit,
      setCache: true,
    });
  }

  async handleUpdateById(id: string, dto: UpdateCategoryDto) {
    const current = await this.categoryRepository.getThrowById({
      id,
      select: getCategorySelect('general'),
    });

    if (dto.slug && dto.slug !== current.slug) {
      await this.categorySlugValidateHelper.assertSlugAvailable(
        dto.slug,
        current.id,
      );
    }

    return await this.categoryRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
      },
      select: getCategorySelect('general'),
      tags: null,
    });
  }

  async handleDeleteById(id: string) {
    return await this.categoryRepository.deleteById({ id, tags: null });
  }
}
