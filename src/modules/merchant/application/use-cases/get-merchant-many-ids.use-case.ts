import { Inject, Injectable } from '@nestjs/common';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';

@Injectable()
export class GetMerchantManyIdsUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(ids: string[]): Promise<Merchant[]> {
    return await this.merchantRepository.getMany({
      where: { id: { in: ids } },
      setCache: true,
    });
  }
}
