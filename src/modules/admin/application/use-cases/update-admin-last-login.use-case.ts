import { Inject, Injectable } from '@nestjs/common';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';

@Injectable()
export class UpdateAdminLastLoginUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const admin = await this.adminRepository.getThrowById({ id });
    admin.setLastLoginAt(new Date());
    await this.adminRepository.updateById({
      id,
      data: admin,
      invalidate: 'none',
    });
  }
}
