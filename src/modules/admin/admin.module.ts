import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from 'src/modules/auth/auth.module';
import { AdminController } from './presentation/controllers/admin.controller';
import { AdminEmailValidateHelper } from './helpers/admin-email-validate.helper';
import { AdminProfilePasswordHelper } from './helpers/admin-profile-password.helper';
import { AdminRoleGuardHelper } from './helpers/admin-role-guard.helper';
import { AdminService } from './application/services/admin.service';
import { AdminRepository } from './repositories/admin.repository';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AdminClient } from './client/admin.client';
import { AdminClientImpl } from './application/services/admin-client.impl';
import { PrismaAdminRepository } from './infrastructure/repositories/prisma-admin.repository';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => AuthModule)],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminRepository,
    AdminRoleGuardHelper,
    AdminEmailValidateHelper,
    AdminProfilePasswordHelper,
    RoleGuard,
    {
      provide: AdminClient,
      useClass: AdminClientImpl,
    },
    {
      provide: 'IAdminRepository',
      useClass: PrismaAdminRepository,
    },
  ],
  exports: [AdminClient, AdminRepository, 'IAdminRepository'],
})
export class AdminModule {}
