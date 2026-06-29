import { Injectable } from '@nestjs/common';

import { AdminRepository } from '../repositories/admin.repository';
import { EAdminRole, EAdminStatus } from 'src/common/enums/admin.enum';
import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
  UpdateProfileAdminDto,
} from '../dto/admin.dto';
import { hashBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminEmailValidateHelper } from '../helpers/admin-email-validate.helper';
import { AdminProfilePasswordHelper } from '../helpers/admin-profile-password.helper';
import { AdminRoleGuardHelper } from '../helpers/admin-role-guard.helper';
import { getAdminSelect } from '../types/select-admin.type';
import { whereAdminGetManyPaginate } from '../types/where-admin.type';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly adminRoleGuardHelper: AdminRoleGuardHelper,
    private readonly adminEmailValidateHelper: AdminEmailValidateHelper,
    private readonly adminProfilePasswordHelper: AdminProfilePasswordHelper,
  ) {}

  async handleCreate(sub: string, dto: CreateAdminDto) {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);
    await this.adminEmailValidateHelper.assertEmailAvailable(dto.email);

    const passwordHash = await hashBcrypt(dto.password);

    return await this.adminRepository.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role ?? EAdminRole.ADMIN,
        status: dto.status ?? EAdminStatus.INACTIVE,
      },
    });
  }

  async handleGetById(id: string) {
    return await this.adminRepository.getThrowById({
      id,
      select: getAdminSelect('general'),
    });
  }

  async handleGetManyPaginate(dto: FilterAdminDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereAdminGetManyPaginate(dto);

    return await this.adminRepository.getManyPaginate({
      where,
      select: getAdminSelect('general'),
      orderBy: { createdAt: sort },
      page,
      limit,
    });
  }

  async handleUpdateById(sub: string, id: string, dto: UpdateAdminDto) {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);

    const current = await this.adminRepository.getThrowById({
      id,
      select: getAdminSelect('general'),
    });

    if (dto.email && dto.email !== current.email) {
      await this.adminEmailValidateHelper.assertEmailAvailable(
        dto.email,
        current.id,
      );
    }

    const passwordHash = dto.password
      ? await hashBcrypt(dto.password)
      : undefined;

    return await this.adminRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.role && { role: dto.role }),
        ...(dto.status && { status: dto.status }),
        ...(passwordHash && { password: passwordHash }),
      },
    });
  }

  async handleUpdateProfile(sub: string, dto: UpdateProfileAdminDto) {
    const current = await this.adminRepository.getThrowById({
      id: sub,
      select: getAdminSelect('withPassword'),
    });

    if (dto.email && dto.email !== current.email) {
      await this.adminEmailValidateHelper.assertEmailAvailable(
        dto.email,
        current.id,
      );
    }

    const passwordHash =
      await this.adminProfilePasswordHelper.resolvePasswordHash(
        dto,
        current.password,
      );

    await this.adminRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(passwordHash && { password: passwordHash }),
      },
    });

    return null;
  }

  async handleDeleteById(sub: string, id: string) {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);

    return await this.adminRepository.deleteById({ id });
  }
}
