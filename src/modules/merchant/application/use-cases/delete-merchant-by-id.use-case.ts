import { Inject, Injectable } from '@nestjs/common';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';

@Injectable()
export class DeleteMerchantByIdUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(id: string): Promise<Merchant> {
    await this.merchantRepository.getThrowById({ id });
    return await this.merchantRepository.deleteById({ id });
  }
}
