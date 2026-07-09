import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { IMerchantRepository } from '../repositories/merchant.repository.interface';

@Injectable()
export class MerchantSlugValidatePolicy {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.merchantRepository.getFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new CustomError({
        statusCode: HttpStatus.CONFLICT,
        message: 'Merchant slug already exists',
      });
    }
  }
}
