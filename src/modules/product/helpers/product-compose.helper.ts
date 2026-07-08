import { Injectable } from '@nestjs/common';

import { CategoryRepository } from 'src/modules/master-data/repositories/category.repository';
import { MerchantRepository } from 'src/modules/merchant/repositories/merchant.repository';
import { BaseComposeHelper } from 'src/common/utils/base-compose.helper';

@Injectable()
export class ProductComposeHelper extends BaseComposeHelper {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly merchantRepository: MerchantRepository,
  ) {
    super({
      category: {
        repository: categoryRepository,
        type: 'one',
      },
      merchant: {
        repository: merchantRepository,
        type: 'one',
      },
    });
  }
}
