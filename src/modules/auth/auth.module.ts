import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthAuthenticatePolicy } from './domain/policies/auth-authenticate.policy';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AdminModule } from 'src/modules/admin/admin.module';
import { AuthClient } from './client/auth.client';
import { AuthClientImpl } from './application/services/auth-client.impl';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    forwardRef(() => AdminModule),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    AuthAuthenticatePolicy,
    JwtStrategy,
    {
      provide: AuthClient,
      useClass: AuthClientImpl,
    },
  ],
  exports: [AuthClient, LoginUseCase],
})
export class AuthModule {}
