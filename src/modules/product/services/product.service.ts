import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

import { ProductCategoryValidateHelper } from '../helpers/product-category-validate.helper';
import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../dto/product.dto';
import { getProductSelect } from '../types/select-product.type';
import { whereProductGetManyPaginate } from '../types/where-product.type';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCategoryValidateHelper: ProductCategoryValidateHelper,
  ) {}

  async handleCreate(dto: CreateProductDto) {
    await this.productCategoryValidateHelper.validateCategoryExists(
      dto.categoryId,
    );

    return this.productRepository.create({
      data: {
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        category: { connect: { id: dto.categoryId } },
        merchant: { connect: { id: dto.merchantId } },
      },
      tags: CacheTags.merchant(dto.merchantId),
      select: getProductSelect('general'),
    });
  }

  async handleGetById(id: string) {
    return this.productRepository.getThrowById({
      id,
      select: getProductSelect('general'),
      setCache: true,
    });
  }

  async handleGetManyPaginate(dto: FilterProductDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereProductGetManyPaginate(dto);

    return this.productRepository.getManyPaginate({
      where,
      select: getProductSelect('general'),
      orderBy: { createdAt: sort },
      page,
      limit,
      setCache: true,
      cacheTags: CacheTags.merchant(dto.merchantId),
    });
  }

  async handleUpdateById(id: string, dto: UpdateProductDto) {
    const current = await this.productRepository.getThrowById({
      id,
      select: getProductSelect('minimal'),
    });

    if (dto.categoryId) {
      await this.productCategoryValidateHelper.validateCategoryExists(
        dto.categoryId,
      );
    }

    return this.productRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.price !== undefined && {
          price: new Prisma.Decimal(dto.price),
        }),
        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),
        ...(dto.merchantId && {
          merchant: { connect: { id: dto.merchantId } },
        }),
      },
      tags: (result) => CacheTags.merchant(result.merchantId),
      select: getProductSelect('general'),
    });
  }

  async handleDeleteById(id: string) {
    return this.productRepository.deleteById({
      id,
      tags: (result) => CacheTags.merchant(result.merchantId),
      select: getProductSelect('general'),
    });
  }
}
