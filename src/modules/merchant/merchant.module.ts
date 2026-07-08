import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MerchantController } from './presentation/controllers/merchant.controller';
import { MerchantService } from './application/services/merchant.service';
import { MerchantRepository } from './repositories/merchant.repository';
import { MerchantClient } from './client/merchant.client';
import { MerchantClientImpl } from './application/services/merchant-client.impl';
import { PrismaMerchantRepository } from './infrastructure/repositories/prisma-merchant.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MerchantController],
  providers: [
    MerchantService,
    MerchantRepository,
    {
      provide: MerchantClient,
      useClass: MerchantClientImpl,
    },
    {
      provide: 'IMerchantRepository',
      useClass: PrismaMerchantRepository,
    },
  ],
  exports: [MerchantClient, MerchantRepository],
})
export class MerchantModule {}
