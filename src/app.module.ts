import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CacheDebugInterceptor } from './common/interceptors/cache-debug.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminModule } from './modules/admin/admin.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { ProductModule } from './modules/product/product.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import { validate } from './config/env.validation';
import { MerchantModule } from './modules/merchant/merchant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, redisConfig],
      validate,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.throttleTtl', 60_000),
          limit: configService.get<number>('app.throttleLimit', 100),
        },
      ],
    }),
    CommonModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    AdminModule,
    MasterDataModule,
    ProductModule,
    MerchantModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheDebugInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
