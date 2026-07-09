import { Inject, Injectable } from '@nestjs/common';

import { EAdminRole, EAdminStatus } from 'src/common/enums/admin.enum';
import { hashBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminEmailValidateHelper } from '../../helpers/admin-email-validate.helper';
import { AdminProfilePasswordHelper } from '../../helpers/admin-profile-password.helper';
import { AdminRoleGuardHelper } from '../../helpers/admin-role-guard.helper';
import {
  IAdminRepository,
  PaginatedResult,
} from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { getAdminSelect } from '../../types/select-admin.type';
import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
  UpdateProfileAdminDto,
} from '../../presentation/dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly adminRoleGuardHelper: AdminRoleGuardHelper,
    private readonly adminEmailValidateHelper: AdminEmailValidateHelper,
    private readonly adminProfilePasswordHelper: AdminProfilePasswordHelper,
  ) {}

  async handleCreate(sub: string, dto: CreateAdminDto): Promise<Admin> {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);
    await this.adminEmailValidateHelper.assertEmailAvailable(dto.email);

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

  async handleGetById(id: string): Promise<Admin> {
    return await this.adminRepository.getThrowById({
      id,
      setCache: true,
    });
  }

  async handleGetManyPaginate(
    dto: FilterAdminDto,
  ): Promise<PaginatedResult<Admin>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
      role: dto.role,
      status: dto.status,
    };

    return await this.adminRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
    });
  }

  async handleUpdateById(
    sub: string,
    id: string,
    dto: UpdateAdminDto,
  ): Promise<Admin> {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);

    const admin = await this.adminRepository.getThrowById({
      id,
    });

    if (dto.email && dto.email !== admin.getEmail()) {
      await this.adminEmailValidateHelper.assertEmailAvailable(
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

  async handleUpdateProfile(
    sub: string,
    dto: UpdateProfileAdminDto,
  ): Promise<null> {
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
      await this.adminEmailValidateHelper.assertEmailAvailable(
        dto.email,
        admin.getId(),
      );
    }

    const passwordHash =
      await this.adminProfilePasswordHelper.resolvePasswordHash(
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

  async handleDeleteById(sub: string, id: string): Promise<Admin> {
    await this.adminRoleGuardHelper.assertSuperAdmin(sub);
    await this.adminRepository.getThrowById({ id });
    return await this.adminRepository.deleteById({ id });
  }

  async handleGetByEmailForAuth(email: string): Promise<Admin | null> {
    return await this.adminRepository.getFirst({
      where: { email },
      select: getAdminSelect('withPassword'),
    });
  }

  async handleUpdateLastLogin(id: string): Promise<void> {
    const admin = await this.adminRepository.getThrowById({ id });
    admin.setLastLoginAt(new Date());
    await this.adminRepository.updateById({
      id,
      data: admin,
      invalidate: 'none',
    });
  }
}
