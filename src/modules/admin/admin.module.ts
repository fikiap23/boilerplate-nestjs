import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from 'src/modules/auth/auth.module';
import { AdminController } from './presentation/controllers/admin.controller';
import { AdminEmailValidatePolicy } from './domain/policies/admin-email-validate.policy';
import { AdminProfilePasswordPolicy } from './domain/policies/admin-profile-password.policy';
import { AdminRoleGuardPolicy } from './domain/policies/admin-role-guard.policy';
import { AdminRepository } from './repositories/admin.repository';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AdminClient } from './client/admin.client';
import { AdminClientImpl } from './application/services/admin-client.impl';
import { PrismaAdminRepository } from './infrastructure/repositories/prisma-admin.repository';

// Use Cases
import { CreateAdminUseCase } from './application/use-cases/create-admin.use-case';
import { GetAdminByIdUseCase } from './application/use-cases/get-admin-by-id.use-case';
import { GetAdminManyPaginateUseCase } from './application/use-cases/get-admin-many-paginate.use-case';
import { UpdateAdminByIdUseCase } from './application/use-cases/update-admin-by-id.use-case';
import { UpdateAdminProfileUseCase } from './application/use-cases/update-admin-profile.use-case';
import { DeleteAdminByIdUseCase } from './application/use-cases/delete-admin-by-id.use-case';
import { GetAdminByEmailForAuthUseCase } from './application/use-cases/get-admin-by-email-for-auth.use-case';
import { UpdateAdminLastLoginUseCase } from './application/use-cases/update-admin-last-login.use-case';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => AuthModule)],
  controllers: [AdminController],
  providers: [
    CreateAdminUseCase,
    GetAdminByIdUseCase,
    GetAdminManyPaginateUseCase,
    UpdateAdminByIdUseCase,
    UpdateAdminProfileUseCase,
    DeleteAdminByIdUseCase,
    GetAdminByEmailForAuthUseCase,
    UpdateAdminLastLoginUseCase,
    AdminRepository,
    AdminRoleGuardPolicy,
    AdminEmailValidatePolicy,
    AdminProfilePasswordPolicy,
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
  exports: [
    AdminClient,
    AdminRepository,
    'IAdminRepository',
    CreateAdminUseCase,
    GetAdminByIdUseCase,
    GetAdminManyPaginateUseCase,
    UpdateAdminByIdUseCase,
    UpdateAdminProfileUseCase,
    DeleteAdminByIdUseCase,
    GetAdminByEmailForAuthUseCase,
    UpdateAdminLastLoginUseCase,
  ],
})
export class AdminModule {}
