import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

import { ProductComposeHelper } from '../helpers/product-compose.helper';
import { ProductCategoryValidateHelper } from '../helpers/product-category-validate.helper';
import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../dto/product.dto';
import {
  getProductSelect,
  splitProductSelect,
} from '../types/select-product.type';
import { whereProductGetManyPaginate } from '../types/where-product.type';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCategoryValidateHelper: ProductCategoryValidateHelper,
    private readonly productComposeHelper: ProductComposeHelper,
  ) {}

  async handleCreate(dto: CreateProductDto) {
    await this.productCategoryValidateHelper.validateCategoryExists(
      dto.categoryId,
    );

    const { dbSelect, relations } = splitProductSelect(
      getProductSelect('general'),
    );
    const created = await this.productRepository.create({
      data: {
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        category: { connect: { id: dto.categoryId } },
      },
      select: dbSelect,
    });

    return this.productComposeHelper.composeOne(created, relations);
  }

  async handleGetById(id: string) {
    const { dbSelect, relations } = splitProductSelect(
      getProductSelect('general'),
    );
    const product = await this.productRepository.getThrowById({
      id,
      select: dbSelect,
      setCache: true,
    });

    return this.productComposeHelper.composeOne(product, relations);
  }

  async handleGetManyPaginate(dto: FilterProductDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereProductGetManyPaginate(dto);
    const { dbSelect, relations } = splitProductSelect(
      getProductSelect('general'),
    );

    const result = await this.productRepository.getManyPaginate({
      where,
      select: dbSelect,
      orderBy: { createdAt: sort },
      page,
      limit,
      setCache: true,
    });

    return {
      data: await this.productComposeHelper.composeMany(result.data, relations),
      meta: result.meta,
    };
  }

  async handleUpdateById(id: string, dto: UpdateProductDto) {
    const { dbSelect, relations } = splitProductSelect(
      getProductSelect('general'),
    );
    const current = await this.productRepository.getThrowById({
      id,
      select: dbSelect,
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
      select: dbSelect,
    });

    return this.productComposeHelper.composeOne(updated, relations);
  }

  async handleDeleteById(id: string) {
    const { dbSelect, relations } = splitProductSelect(
      getProductSelect('general'),
    );
    const deleted = await this.productRepository.deleteById({
      id,
      select: dbSelect,
    });

    return this.productComposeHelper.composeOne(deleted, relations);
  }
}
