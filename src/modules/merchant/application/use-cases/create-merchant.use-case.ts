import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { CreateMerchantDto } from '../../presentation/dto/merchant.dto';

@Injectable()
export class CreateMerchantUseCase {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async execute(dto: CreateMerchantDto): Promise<Merchant> {
    const existing = await this.merchantRepository.getFirst({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new CustomError({
        statusCode: HttpStatus.CONFLICT,
        message: 'Merchant slug already exists',
      });
    }

    const merchant = new Merchant({
      name: dto.name,
      slug: dto.slug,
    });

    return await this.merchantRepository.create({
      data: merchant,
    });
  }
}
