import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CategoryController } from './controllers/category.controller';
import { CategorySlugValidateHelper } from './helpers/category-slug-validate.helper';
import { CategoryService } from './services/category.service';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, CategorySlugValidateHelper],
  exports: [CategoryService, CategoryRepository],
})
export class MasterDataModule {}
