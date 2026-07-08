import { Injectable } from '@nestjs/common';
import { MerchantClient } from '../../client/merchant.client';
import { MerchantClientResponse } from '../../client/merchant.response';
import { MerchantService } from './merchant.service';

@Injectable()
export class MerchantClientImpl implements MerchantClient {
  constructor(private readonly merchantService: MerchantService) {}

  async getMerchant(id: string): Promise<MerchantClientResponse | null> {
    try {
      const merchant = await this.merchantService.handleGetById(id);
      if (!merchant) return null;
      return {
        id: merchant.getId(),
        name: merchant.getName(),
        slug: merchant.getSlug(),
      };
    } catch {
      return null;
    }
  }
}
