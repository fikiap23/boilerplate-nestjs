import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MerchantController } from './controllers/merchant.controller';
import { MerchantService } from './services/merchant.service';
import { MerchantRepository } from './repositories/merchant.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MerchantController],
  providers: [MerchantService, MerchantRepository],
  exports: [MerchantService, MerchantRepository],
})
export class MerchantModule {}
