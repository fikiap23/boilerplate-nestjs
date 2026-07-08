import { MerchantClientResponse } from './merchant.response';

export abstract class MerchantClient {
  abstract getMerchant(id: string): Promise<MerchantClientResponse | null>;
}
