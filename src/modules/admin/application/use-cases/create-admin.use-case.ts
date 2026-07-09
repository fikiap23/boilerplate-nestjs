import { Inject, Injectable } from '@nestjs/common';
import { EAdminRole, EAdminStatus } from 'src/common/enums/admin.enum';
import { hashBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminEmailValidatePolicy } from '../../domain/policies/admin-email-validate.policy';
import { AdminRoleGuardPolicy } from '../../domain/policies/admin-role-guard.policy';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { CreateAdminDto } from '../../presentation/dto/admin.dto';

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly adminRoleGuardPolicy: AdminRoleGuardPolicy,
    private readonly adminEmailValidatePolicy: AdminEmailValidatePolicy,
  ) {}

  async execute(sub: string, dto: CreateAdminDto): Promise<Admin> {
    await this.adminRoleGuardPolicy.assertSuperAdmin(sub);
    await this.adminEmailValidatePolicy.assertEmailAvailable(dto.email);

    const passwordHash = await hashBcrypt(dto.password);

    const admin = new Admin({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      role: dto.role ?? EAdminRole.ADMIN,
      status: dto.status ?? EAdminStatus.INACTIVE,
    });

    return await this.adminRepository.create({
      data: admin,
    });
  }
}
