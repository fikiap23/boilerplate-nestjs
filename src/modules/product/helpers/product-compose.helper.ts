import { Injectable } from '@nestjs/common';

import { CategoryRepository } from 'src/modules/master-data/repositories/category.repository';
import { BaseComposeHelper } from 'src/common/utils/base-compose.helper';

@Injectable()
export class ProductComposeHelper extends BaseComposeHelper {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super({
      category: {
        repository: categoryRepository,
        type: 'one',
      },
    });
  }
}
