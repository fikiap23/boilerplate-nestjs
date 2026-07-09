import { Injectable } from '@nestjs/common';
import { MerchantClient } from '../../client/merchant.client';
import { MerchantClientResponse } from '../../client/merchant.response';
import { GetMerchantByIdUseCase } from '../use-cases/get-merchant-by-id.use-case';
import { GetMerchantManyIdsUseCase } from '../use-cases/get-merchant-many-ids.use-case';

@Injectable()
export class MerchantClientImpl implements MerchantClient {
  constructor(
    private readonly getMerchantByIdUseCase: GetMerchantByIdUseCase,
    private readonly getMerchantManyIdsUseCase: GetMerchantManyIdsUseCase,
  ) {}

  async getMerchantById(id: string): Promise<MerchantClientResponse | null> {
    try {
      const merchant = await this.getMerchantByIdUseCase.execute(id);
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

  async getMerchantsByIds(ids: string[]): Promise<MerchantClientResponse[]> {
    try {
      const merchants = await this.getMerchantManyIdsUseCase.execute(ids);
      return merchants.map((merchant) => ({
        id: merchant.getId(),
        name: merchant.getName(),
        slug: merchant.getSlug(),
      }));
    } catch {
      return [];
    }
  }
}
