import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { UpdateMerchantDto } from '../../presentation/dto/merchant.dto';

@Injectable()
export class UpdateMerchantByIdUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(id: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const merchant = await this.merchantRepository.getThrowById({
      id,
    });

    if (dto.slug && dto.slug !== merchant.getSlug()) {
      const existing = await this.merchantRepository.getFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new CustomError({
          statusCode: HttpStatus.CONFLICT,
          message: 'Merchant slug already exists',
        });
      }
    }

    merchant.updateDetails(dto.name, dto.slug);

    return await this.merchantRepository.updateById({
      id,
      data: merchant,
    });
  }
}
