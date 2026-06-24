import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from 'src/modules/auth/auth.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminRepository } from './repositories/admin.repository';
import { RoleGuard } from 'src/common/guards/role.guard';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => AuthModule)],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, RoleGuard],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
