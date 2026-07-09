import { Inject, Injectable } from '@nestjs/common';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { CreateMerchantDto } from '../../presentation/dto/merchant.dto';
import { MerchantSlugValidatePolicy } from '../../domain/policies/merchant-slug-validate.policy';

@Injectable()
export class CreateMerchantUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
    private readonly merchantSlugValidatePolicy: MerchantSlugValidatePolicy,
  ) {}

  async execute(dto: CreateMerchantDto): Promise<Merchant> {
    await this.merchantSlugValidatePolicy.assertSlugAvailable(dto.slug);

    const merchant = new Merchant({
      name: dto.name,
      slug: dto.slug,
    });

    return await this.merchantRepository.create({
      data: merchant,
    });
  }
}
