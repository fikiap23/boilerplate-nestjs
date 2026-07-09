import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CategoryController } from './presentation/controllers/category.controller';
import { CategorySlugValidatePolicy } from './domain/policies/category-slug-validate.policy';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryClient } from './client/category.client';
import { CategoryClientImpl } from './application/services/category-client.impl';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';

// Use Cases
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoryByIdUseCase } from './application/use-cases/get-category-by-id.use-case';
import { GetCategoryManyPaginateUseCase } from './application/use-cases/get-category-many-paginate.use-case';
import { UpdateCategoryByIdUseCase } from './application/use-cases/update-category-by-id.use-case';
import { DeleteCategoryByIdUseCase } from './application/use-cases/delete-category-by-id.use-case';
import { GetCategoryManyIdsUseCase } from './application/use-cases/get-category-many-ids.use-case';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CategoryController],
  providers: [
    CreateCategoryUseCase,
    GetCategoryByIdUseCase,
    GetCategoryManyPaginateUseCase,
    UpdateCategoryByIdUseCase,
    DeleteCategoryByIdUseCase,
    GetCategoryManyIdsUseCase,
    CategoryRepository,
    CategorySlugValidatePolicy,
    {
      provide: CategoryClient,
      useClass: CategoryClientImpl,
    },
    {
      provide: 'ICategoryRepository',
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [
    CategoryClient,
    CategoryRepository,
    CreateCategoryUseCase,
    GetCategoryByIdUseCase,
    GetCategoryManyPaginateUseCase,
    UpdateCategoryByIdUseCase,
    DeleteCategoryByIdUseCase,
    GetCategoryManyIdsUseCase,
  ],
})
export class MasterDataModule {}
