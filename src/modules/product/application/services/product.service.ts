import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

import { ProductCategoryValidateHelper } from '../../helpers/product-category-validate.helper';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../../presentation/dto/product.dto';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { whereProductGetManyPaginate } from '../../types/where-product.type';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { getProductSelect } from '../../types/select-product.type';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly productCategoryValidateHelper: ProductCategoryValidateHelper,
  ) {}

  async handleCreate(dto: CreateProductDto) {
    await this.productCategoryValidateHelper.validateCategoryExists(
      dto.categoryId,
    );

    const product = new Product();
    product.setName(dto.name);
    product.setPrice(dto.price);
    product.setStock(dto.stock);
    product.setDescription(dto.description || null);
    product.setCategoryId(dto.categoryId);
    product.setMerchantId(dto.merchantId);

    return this.productRepository.create({
      data: product,
      select: getProductSelect('general'),
    });
  }

  async handleGetById(id: string) {
    return this.productRepository.getThrowById({
      id,
      setCache: true,
      select: getProductSelect('general'),
    });
  }

  async handleGetManyPaginate(dto: FilterProductDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereProductGetManyPaginate(dto);

    return this.productRepository.getManyPaginate({
      where,
      orderBy: { createdAt: sort },
      page,
      limit,
      setCache: true,
      cacheTags: CacheTags.merchant(dto.merchantId),
      select: getProductSelect('general'),
    });
  }

  async handleUpdateById(id: string, dto: UpdateProductDto) {
    const raw = await this.productRepository.getThrowById({
      id,
      select: getProductSelect('general'),
    });
    const product = Product.fromPrisma(raw);

    if (dto.categoryId) {
      await this.productCategoryValidateHelper.validateCategoryExists(
        dto.categoryId,
      );
    }

    product.setName(dto.name);
    product.setDescription(dto.description);
    product.setPrice(dto.price);
    product.setStock(dto.stock);
    product.setCategoryId(dto.categoryId);

    return this.productRepository.updateById({
      id,
      data: product,
      select: getProductSelect('general'),
    });
  }

  async handleDeleteById(id: string) {
    return this.productRepository.deleteById({
      id,
      select: getProductSelect('general'),
    });
  }

  async handleReduceStock(id: string, quantity: number) {
    await this.prisma.execTx(
      async (tx) => {
        const raw = await this.productRepository.getThrowById({
          tx,
          id,
          lock: { mode: 'noKeyUpdate' },
          select: getProductSelect('general'),
        });
        const product = Product.fromPrisma(raw);

        product.reduceStock(quantity);

        await this.productRepository.updateById({
          tx,
          id,
          data: product,
          invalidate: 'none',
          select: { id: true },
        });
      },
      async () => {
        await this.productRepository.invalidateCache({ id });
      },
    );
  }

  async handleRestoreStock(id: string, quantity: number) {
    await this.prisma.execTx(
      async (tx) => {
        const raw = await this.productRepository.getThrowById({
          tx,
          id,
          lock: { mode: 'noKeyUpdate' },
          select: getProductSelect('general'),
        });
        const product = Product.fromPrisma(raw);

        product.restoreStock(quantity);

        await this.productRepository.updateById({
          tx,
          id,
          data: product,
          invalidate: 'none',
          select: { id: true },
        });
      },
      async () => {
        await this.productRepository.invalidateCache({ id });
      },
    );
  }
}
