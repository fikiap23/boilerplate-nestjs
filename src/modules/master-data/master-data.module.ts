import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CategoryController } from './presentation/controllers/category.controller';
import { CategorySlugValidateHelper } from './helpers/category-slug-validate.helper';
import { CategoryService } from './application/services/category.service';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryClient } from './client/category.client';
import { CategoryClientImpl } from './application/services/category-client.impl';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    CategorySlugValidateHelper,
    {
      provide: CategoryClient,
      useClass: CategoryClientImpl,
    },
    {
      provide: 'ICategoryRepository',
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [CategoryClient, CategoryRepository],
})
export class MasterDataModule {}
