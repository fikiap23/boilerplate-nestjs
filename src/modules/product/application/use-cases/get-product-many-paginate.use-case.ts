import { Inject, Injectable } from '@nestjs/common';
import { FilterProductDto } from '../../presentation/dto/product.dto';
import {
  IProductRepository,
  PaginatedResult,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class GetProductManyPaginateUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(dto: FilterProductDto): Promise<PaginatedResult<Product>> {
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
}
