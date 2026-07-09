import { Inject, Injectable } from '@nestjs/common';
import { AdminRoleGuardPolicy } from '../../domain/policies/admin-role-guard.policy';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';

@Injectable()
export class DeleteAdminByIdUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly adminRoleGuardPolicy: AdminRoleGuardPolicy,
  ) {}

  async execute(sub: string, id: string): Promise<Admin> {
    await this.adminRoleGuardPolicy.assertSuperAdmin(sub);
    await this.adminRepository.getThrowById({ id });
    return await this.adminRepository.deleteById({ id });
  }
}
