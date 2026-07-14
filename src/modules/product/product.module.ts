import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MasterDataModule } from 'src/modules/master-data/master-data.module';
import { ProductController } from './controllers/product.controller';
import { ProductCategoryValidateHelper } from './helpers/product-category-validate.helper';
import { ProductService } from './services/product.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [JwtModule.register({}), MasterDataModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, ProductCategoryValidateHelper],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
