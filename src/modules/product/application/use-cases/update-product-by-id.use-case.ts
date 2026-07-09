import { Inject, Injectable } from '@nestjs/common';
import { ProductValidatePolicy } from '../../domain/policies/product-validate.policy';
import { UpdateProductDto } from '../../presentation/dto/product.dto';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class UpdateProductByIdUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly productValidatePolicy: ProductValidatePolicy,
  ) {}

  async execute(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.getThrowById({
      id,
    });

    if (dto.categoryId) {
      await this.productValidatePolicy.validateCategoryExists(dto.categoryId);
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
}
