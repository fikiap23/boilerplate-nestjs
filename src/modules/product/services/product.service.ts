import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

import { ProductCategoryComposeHelper } from '../helpers/product-category-compose.helper';
import { ProductCategoryValidateHelper } from '../helpers/product-category-validate.helper';
import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../dto/product.dto';
import { getProductSelect } from '../types/select-product.type';
import { whereProductGetManyPaginate } from '../types/where-product.type';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCategoryValidateHelper: ProductCategoryValidateHelper,
    private readonly productCategoryComposeHelper: ProductCategoryComposeHelper,
  ) {}

  async handleCreate(dto: CreateProductDto) {
    await this.productCategoryValidateHelper.validateCategoryExists(
      dto.categoryId,
    );

    const created = await this.productRepository.create({
      data: {
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        category: { connect: { id: dto.categoryId } },
      },
      select: getProductSelect('general'),
    });

    return this.productCategoryComposeHelper.composeOne(created);
  }

  async handleGetById(id: string) {
    const product = await this.productRepository.getThrowById({
      id,
      select: getProductSelect('general'),
    });

    return this.productCategoryComposeHelper.composeOne(product);
  }

  async handleGetManyPaginate(dto: FilterProductDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereProductGetManyPaginate(dto);

    const result = await this.productRepository.getManyPaginate({
      where,
      select: getProductSelect('general'),
      orderBy: { createdAt: sort },
      page,
      limit,
    });

    return {
      data: await this.productCategoryComposeHelper.composeMany(result.data),
      meta: result.meta,
    };
  }

  async handleUpdateById(id: string, dto: UpdateProductDto) {
    const current = await this.productRepository.getThrowById({
      id,
      select: getProductSelect('general'),
    });

    if (dto.categoryId) {
      await this.productCategoryValidateHelper.validateCategoryExists(
        dto.categoryId,
      );
    }

    const updated = await this.productRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.price !== undefined && {
          price: new Prisma.Decimal(dto.price),
        }),
        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),
      },
      select: getProductSelect('general'),
    });

    return this.productCategoryComposeHelper.composeOne(updated);
  }

  async handleDeleteById(id: string) {
    const deleted = await this.productRepository.deleteById({
      id,
      select: getProductSelect('general'),
    });

    return this.productCategoryComposeHelper.composeOne(deleted);
  }
}
