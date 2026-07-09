import { Inject, Injectable } from '@nestjs/common';
import {
  IMerchantRepository,
  PaginatedResult,
} from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { FilterMerchantDto } from '../../presentation/dto/merchant.dto';

@Injectable()
export class GetMerchantManyPaginateUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(dto: FilterMerchantDto): Promise<PaginatedResult<Merchant>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
    };

    return await this.merchantRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
    });
  }
}
