import { Inject, Injectable } from '@nestjs/common';
import { ProductValidatePolicy } from '../../domain/policies/product-validate.policy';
import { CreateProductDto } from '../../presentation/dto/product.dto';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Stock } from '../../domain/value-objects/stock.value-object';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly productValidatePolicy: ProductValidatePolicy,
  ) {}

  async execute(dto: CreateProductDto): Promise<Product> {
    await this.productValidatePolicy.validateCategoryExists(dto.categoryId);
    await this.productValidatePolicy.validateMerchantExists(dto.merchantId);

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
