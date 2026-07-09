import { Inject, Injectable } from '@nestjs/common';
import { AdminEmailValidatePolicy } from '../../domain/policies/admin-email-validate.policy';
import { AdminProfilePasswordPolicy } from '../../domain/policies/admin-profile-password.policy';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { UpdateProfileAdminDto } from '../../presentation/dto/admin.dto';

@Injectable()
export class UpdateAdminProfileUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly adminEmailValidatePolicy: AdminEmailValidatePolicy,
    private readonly adminProfilePasswordPolicy: AdminProfilePasswordPolicy,
  ) {}

  async execute(sub: string, dto: UpdateProfileAdminDto): Promise<null> {
    const admin = await this.adminRepository.getThrowById({
      id: sub,
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
    });

    if (dto.email && dto.email !== admin.getEmail()) {
      await this.adminEmailValidatePolicy.assertEmailAvailable(
        dto.email,
        admin.getId(),
      );
    }

    const passwordHash =
      await this.adminProfilePasswordPolicy.resolvePasswordHash(
        dto,
        admin.getPassword(),
      );

    admin.updateProfile(dto.name, dto.email, passwordHash);

    await this.adminRepository.updateById({
      id: sub,
      data: admin,
    });

    return null;
  }
}
