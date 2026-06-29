import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthAuthenticateHelper } from './helpers/auth-authenticate.helper';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AdminModule } from 'src/modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    forwardRef(() => AdminModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthAuthenticateHelper, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
