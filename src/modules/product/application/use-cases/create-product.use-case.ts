import { Inject, Injectable } from '@nestjs/common';
import { ProductCategoryValidatePolicy } from '../../domain/policies/product-category-validate.policy';
import { CreateProductDto } from '../../presentation/dto/product.dto';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Stock } from '../../domain/value-objects/stock.value-object';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { MerchantClient } from 'src/modules/merchant/client';
import { CustomError } from 'src/common/exceptions/custom-error';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly productCategoryValidatePolicy: ProductCategoryValidatePolicy,
    private readonly merchantClient: MerchantClient,
  ) {}

  async execute(dto: CreateProductDto): Promise<Product> {
    await this.productCategoryValidatePolicy.validateCategoryExists(
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
}
