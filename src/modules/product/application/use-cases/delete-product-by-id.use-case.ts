import { Inject, Injectable } from '@nestjs/common';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class DeleteProductByIdUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    return this.productRepository.deleteById({
      id,
      tags: (result: Product) => CacheTags.merchant(result.getMerchantId()),
    });
  }
}
