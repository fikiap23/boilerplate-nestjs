import { Inject, Injectable } from '@nestjs/common';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { getAdminSelect } from '../../types/select-admin.type';

@Injectable()
export class GetAdminByEmailForAuthUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(email: string): Promise<Admin | null> {
    return await this.adminRepository.getFirst({
      where: { email },
      select: getAdminSelect('withPassword'),
    });
  }
}
