import { MerchantClientResponse } from './merchant.response';

export abstract class MerchantClient {
  abstract getMerchantById(id: string): Promise<MerchantClientResponse | null>;
  abstract getMerchantsByIds(ids: string[]): Promise<MerchantClientResponse[]>;
}
