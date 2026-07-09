import { Inject, Injectable } from '@nestjs/common';
import { hashBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminEmailValidatePolicy } from '../../domain/policies/admin-email-validate.policy';
import { AdminRoleGuardPolicy } from '../../domain/policies/admin-role-guard.policy';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { UpdateAdminDto } from '../../presentation/dto/admin.dto';

@Injectable()
export class UpdateAdminByIdUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly adminRoleGuardPolicy: AdminRoleGuardPolicy,
    private readonly adminEmailValidatePolicy: AdminEmailValidatePolicy,
  ) {}

  async execute(sub: string, id: string, dto: UpdateAdminDto): Promise<Admin> {
    await this.adminRoleGuardPolicy.assertSuperAdmin(sub);

    const admin = await this.adminRepository.getThrowById({
      id,
    });

    if (dto.email && dto.email !== admin.getEmail()) {
      await this.adminEmailValidatePolicy.assertEmailAvailable(
        dto.email,
        admin.getId(),
      );
    }

    if (dto.password) {
      const passwordHash = await hashBcrypt(dto.password);
      admin.setPassword(passwordHash);
    }

    if (dto.name) admin.setName(dto.name);
    if (dto.email) admin.setEmail(dto.email);
    if (dto.role) admin.setRole(dto.role);
    if (dto.status) admin.setStatus(dto.status);

    return await this.adminRepository.updateById({
      id,
      data: admin,
    });
  }
}
