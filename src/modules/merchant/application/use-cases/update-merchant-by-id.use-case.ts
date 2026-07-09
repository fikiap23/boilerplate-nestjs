import { Inject, Injectable } from '@nestjs/common';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { UpdateMerchantDto } from '../../presentation/dto/merchant.dto';
import { MerchantSlugValidatePolicy } from '../../domain/policies/merchant-slug-validate.policy';

@Injectable()
export class UpdateMerchantByIdUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
    private readonly merchantSlugValidatePolicy: MerchantSlugValidatePolicy,
  ) {}

  async execute(id: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.merchantRepository.getThrowById({
      id,
    });

    if (dto.slug && dto.slug !== merchant.getSlug()) {
      await this.merchantSlugValidatePolicy.assertSlugAvailable(dto.slug, id);
    }

    merchant.setName(dto.name);
    merchant.setSlug(dto.slug);

    return await this.merchantRepository.updateById({
      id,
      data: merchant,
    });
  }
}
