import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MasterDataModule } from 'src/modules/master-data/master-data.module';
import { MerchantModule } from 'src/modules/merchant/merchant.module';
import { ProductController } from './presentation/controllers/product.controller';
import { ProductComposePolicy } from './domain/policies/product-compose.policy';
import { ProductValidatePolicy } from './domain/policies/product-validate.policy';
import { ProductRepository } from './repositories/product.repository';
import { ProductClient } from './client/product.client';
import { ProductClientImpl } from './application/services/product-client.impl';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';

// Use Cases
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { GetProductManyPaginateUseCase } from './application/use-cases/get-product-many-paginate.use-case';
import { UpdateProductByIdUseCase } from './application/use-cases/update-product-by-id.use-case';
import { DeleteProductByIdUseCase } from './application/use-cases/delete-product-by-id.use-case';
import { ReduceProductStockUseCase } from './application/use-cases/reduce-product-stock.use-case';
import { RestoreProductStockUseCase } from './application/use-cases/restore-product-stock.use-case';

@Module({
  imports: [JwtModule.register({}), MasterDataModule, MerchantModule],
  controllers: [ProductController],
  providers: [
    CreateProductUseCase,
    GetProductByIdUseCase,
    GetProductManyPaginateUseCase,
    UpdateProductByIdUseCase,
    DeleteProductByIdUseCase,
    ReduceProductStockUseCase,
    RestoreProductStockUseCase,
    ProductRepository,
    ProductValidatePolicy,
    ProductComposePolicy,
    {
      provide: ProductClient,
      useClass: ProductClientImpl,
    },
    {
      provide: 'IProductRepository',
      useClass: PrismaProductRepository,
    },
  ],
  exports: [
    ProductClient,
    CreateProductUseCase,
    GetProductByIdUseCase,
    GetProductManyPaginateUseCase,
    UpdateProductByIdUseCase,
    DeleteProductByIdUseCase,
    ReduceProductStockUseCase,
    RestoreProductStockUseCase,
  ],
})
export class ProductModule {}
