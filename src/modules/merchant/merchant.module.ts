import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MerchantController } from './presentation/controllers/merchant.controller';
import { MerchantRepository } from './repositories/merchant.repository';
import { MerchantClient } from './client/merchant.client';
import { MerchantClientImpl } from './application/services/merchant-client.impl';
import { PrismaMerchantRepository } from './infrastructure/repositories/prisma-merchant.repository';

// Use Cases
import { CreateMerchantUseCase } from './application/use-cases/create-merchant.use-case';
import { GetMerchantByIdUseCase } from './application/use-cases/get-merchant-by-id.use-case';
import { GetMerchantManyPaginateUseCase } from './application/use-cases/get-merchant-many-paginate.use-case';
import { UpdateMerchantByIdUseCase } from './application/use-cases/update-merchant-by-id.use-case';
import { DeleteMerchantByIdUseCase } from './application/use-cases/delete-merchant-by-id.use-case';
import { GetMerchantManyIdsUseCase } from './application/use-cases/get-merchant-many-ids.use-case';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MerchantController],
  providers: [
    CreateMerchantUseCase,
    GetMerchantByIdUseCase,
    GetMerchantManyPaginateUseCase,
    UpdateMerchantByIdUseCase,
    DeleteMerchantByIdUseCase,
    GetMerchantManyIdsUseCase,
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
  exports: [
    MerchantClient,
    MerchantRepository,
    CreateMerchantUseCase,
    GetMerchantByIdUseCase,
    GetMerchantManyPaginateUseCase,
    UpdateMerchantByIdUseCase,
    DeleteMerchantByIdUseCase,
    GetMerchantManyIdsUseCase,
  ],
})
export class MerchantModule {}
