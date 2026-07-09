import { Inject, Injectable } from '@nestjs/common';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';

@Injectable()
export class GetAdminByIdUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(id: string): Promise<Admin> {
    return await this.adminRepository.getThrowById({
      id,
      setCache: true,
    });
  }
}
