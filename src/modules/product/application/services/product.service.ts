import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

import { ProductCategoryValidateHelper } from '../../helpers/product-category-validate.helper';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../../presentation/dto/product.dto';
import {
  IProductRepository,
  PaginatedResult,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Stock } from '../../domain/value-objects/stock.value-object';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { MerchantClient } from 'src/modules/merchant/client';
import { CustomError } from 'src/common/exceptions/custom-error';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly productCategoryValidateHelper: ProductCategoryValidateHelper,
    private readonly merchantClient: MerchantClient,
  ) {}

  async handleCreate(dto: CreateProductDto): Promise<Product> {
    await this.productCategoryValidateHelper.validateCategoryExists(
      dto.categoryId,
    );
    const merchant = await this.merchantClient.getMerchant(dto.merchantId);

    if (!merchant) {
      throw new CustomError({
        statusCode: 404,
        message: 'Merchant not found',
      });
    }

    console.log(merchant);

    const product = new Product({
      name: dto.name,
      price: new Price(dto.price),
      stock: new Stock(dto.stock),
      description: dto.description || null,
      categoryId: dto.categoryId,
      merchantId: dto.merchantId,
    });

    return this.productRepository.create({
      data: product,
      tags: CacheTags.merchant(dto.merchantId),
    });
  }

  async handleGetById(id: string): Promise<Product> {
    return this.productRepository.getThrowById({
      id,
      setCache: true,
    });
  }

  async handleGetManyPaginate(
    dto: FilterProductDto,
  ): Promise<PaginatedResult<Product>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
      categoryId: dto.categoryId,
      merchantId: dto.merchantId,
    };

    return this.productRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
      cacheTags: CacheTags.merchant(dto.merchantId),
    });
  }

  async handleUpdateById(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.getThrowById({
      id,
    });

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
      tags: (result: Product) => CacheTags.merchant(result.getMerchantId()),
    });
  }

  async handleDeleteById(id: string): Promise<Product> {
    return this.productRepository.deleteById({
      id,
      tags: (result: Product) => CacheTags.merchant(result.getMerchantId()),
    });
  }

  async handleReduceStock(id: string, quantity: number): Promise<void> {
    let merchantId: string;

    await this.prisma.execTx(
      async (tx) => {
        const product = await this.productRepository.getThrowById({
          tx,
          id,
          lock: { mode: 'noKeyUpdate' },
        });

        product.reduceStock(quantity);
        merchantId = product.getMerchantId();

        await this.productRepository.updateById({
          tx,
          id,
          data: product,
          invalidate: 'none',
        });
      },
      async () => {
        await this.productRepository.invalidateCache({ id });
        await this.productRepository.invalidateCache({
          tags: CacheTags.merchant(merchantId),
        });
      },
    );
  }

  async handleRestoreStock(id: string, quantity: number): Promise<void> {
    let merchantId: string;

    await this.prisma.execTx(
      async (tx) => {
        const product = await this.productRepository.getThrowById({
          tx,
          id,
          lock: { mode: 'noKeyUpdate' },
        });

        product.restoreStock(quantity);
        merchantId = product.getMerchantId();

        await this.productRepository.updateById({
          tx,
          id,
          data: product,
          invalidate: 'none',
        });
      },
      async () => {
        await this.productRepository.invalidateCache({ id });
        await this.productRepository.invalidateCache({
          tags: CacheTags.merchant(merchantId),
        });
      },
    );
  }
}
