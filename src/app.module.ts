import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CacheDebugInterceptor } from './common/interceptors/cache-debug.interceptor';
import { AdminModule } from './modules/admin/admin.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { ProductModule } from './modules/product/product.module';
import { CommonModule } from './common/common.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, redisConfig],
      validate,
    }),
    CommonModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    AdminModule,
    MasterDataModule,
    ProductModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheDebugInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
