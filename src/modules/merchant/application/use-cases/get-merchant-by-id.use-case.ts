import { Inject, Injectable } from '@nestjs/common';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';

@Injectable()
export class GetMerchantByIdUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(id: string): Promise<Merchant> {
    return await this.merchantRepository.getThrowById({
      id,
      setCache: true,
    });
  }
}
