import { Injectable } from '@nestjs/common';

import { CategoryClient } from 'src/modules/master-data/client/category.client';
import { MerchantClient } from 'src/modules/merchant/client/merchant.client';
import { BaseComposeHelper } from 'src/common/utils/base-compose.helper';

@Injectable()
export class ProductComposePolicy extends BaseComposeHelper {
  constructor(
    private readonly categoryClient: CategoryClient,
    private readonly merchantClient: MerchantClient,
  ) {
    super({
      category: {
        loader: (ids) => categoryClient.getCategoriesByIds(ids),
        type: 'one',
      },
      merchant: {
        loader: (ids) => merchantClient.getMerchantsByIds(ids),
        type: 'one',
      },
    });
  }
}
