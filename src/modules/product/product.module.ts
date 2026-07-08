import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MasterDataModule } from 'src/modules/master-data/master-data.module';
import { MerchantModule } from 'src/modules/merchant/merchant.module';
import { ProductController } from './presentation/controllers/product.controller';
import { ProductComposeHelper } from './helpers/product-compose.helper';
import { ProductCategoryValidateHelper } from './helpers/product-category-validate.helper';
import { ProductService } from './application/services/product.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductClient } from './client/product.client';
import { ProductClientImpl } from './application/services/product-client.impl';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';

@Module({
  imports: [JwtModule.register({}), MasterDataModule, MerchantModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    ProductCategoryValidateHelper,
    ProductComposeHelper,
    {
      provide: ProductClient,
      useClass: ProductClientImpl,
    },
    {
      provide: 'IProductRepository',
      useClass: PrismaProductRepository,
    },
  ],
  exports: [ProductClient],
})
export class ProductModule {}
