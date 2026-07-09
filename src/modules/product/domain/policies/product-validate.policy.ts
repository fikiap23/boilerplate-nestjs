import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { CategoryClient } from 'src/modules/master-data/client/category.client';
import { MerchantClient } from 'src/modules/merchant/client/merchant.client';

@Injectable()
export class ProductValidatePolicy {
  constructor(
    private readonly categoryClient: CategoryClient,
    private readonly merchantClient: MerchantClient,
  ) {}

  async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryClient.getCategory(categoryId);
    if (!category) {
      throw new CustomError({
        statusCode: 404,
        message: 'Category not found',
      });
    }
  }

  async validateMerchantExists(merchantId: string): Promise<void> {
    const merchant = await this.merchantClient.getMerchant(merchantId);
    if (!merchant) {
      throw new CustomError({
        statusCode: 404,
        message: 'Merchant not found',
      });
    }
  }
}
