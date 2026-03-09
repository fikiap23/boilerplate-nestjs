import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AdminRepository } from '../repositories/admin.repository';
import { EAdminRole, EAdminStatus } from 'utils/enum';
import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
  UpdateProfileAdminDto,
} from '../dto/admin.dto';
import { CustomError } from 'utils/errors/custom-error';
import { getAdminSelect } from '../props/select-admin.prop';
import { whereAdminGetManyPaginate } from '../props/where-admin.prop';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async handleCreate(sub: string, dto: CreateAdminDto) {
    const creator = await this.adminRepository.getThrowById({
      id: sub,
      select: getAdminSelect('general'),
    });

    if (creator.role !== EAdminRole.SUPERADMIN) {
      throw new CustomError({ statusCode: 403, message: 'Forbidden' });
    }

    const byEmail = await this.adminRepository.getFirst({
      where: { email: dto.email },
      select: getAdminSelect('minimal'),
    });

    if (byEmail) {
      throw new CustomError({
        statusCode: 409,
        message: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.adminRepository.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: dto.role ?? EAdminRole.ADMIN,
        status: dto.status ?? EAdminStatus.INACTIVE,
      },
    });

    return created;
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
      orderBy: { createdAt: sort },
      page,
      limit,
    });
  }

  async handleUpdateById(sub: string, id: string, dto: UpdateAdminDto) {
    const actor = await this.adminRepository.getThrowById({
      id: sub,
      select: getAdminSelect('general'),
    });

    if (actor.role !== EAdminRole.SUPERADMIN) {
      throw new CustomError({ statusCode: 403, message: 'Forbidden' });
    }

    const current = await this.adminRepository.getThrowById({
      id,
      select: getAdminSelect('general'),
    });

    if (dto.email && dto.email !== current.email) {
      const byEmail = await this.adminRepository.getFirst({
        where: {
          email: dto.email,
          NOT: { id: current.id },
        },
        select: getAdminSelect('minimal'),
      });

      if (byEmail) {
        throw new CustomError({
          statusCode: 409,
          message: 'Email already exists',
        });
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    const updated = await this.adminRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.role && { role: dto.role }),
        ...(dto.status && { status: dto.status }),
        ...(passwordHash && { password: passwordHash }),
      },
    });

    return updated;
  }

  async handleUpdateProfile(sub: string, dto: UpdateProfileAdminDto) {
    const current = await this.adminRepository.getThrowById({
      id: sub,
      select: getAdminSelect('general'),
    });

    if (dto.email && dto.email !== current.email) {
      const byEmail = await this.adminRepository.getFirst({
        where: {
          email: dto.email,
          NOT: { id: current.id },
        },
        select: getAdminSelect('minimal'),
      });

      if (byEmail) {
        throw new CustomError({
          statusCode: 409,
          message: 'Email already exists',
        });
      }
    }

    let passwordHash: string | undefined;

    if (dto.oldPassword && dto.newPassword) {
      const isMatch = await bcrypt.compare(dto.oldPassword, current.password);

      if (!isMatch) {
        throw new CustomError({
          statusCode: 400,
          message: 'Current password is incorrect',
        });
      }

      passwordHash = await bcrypt.hash(dto.newPassword, 10);
    } else if (dto.oldPassword && !dto.newPassword) {
      throw new CustomError({
        statusCode: 400,
        message: 'newPassword is required when changing password',
      });
    }

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
    const actor = await this.adminRepository.getThrowById({
      id: sub,
      select: getAdminSelect('general'),
    });

    if (actor.role !== EAdminRole.SUPERADMIN) {
      throw new CustomError({ statusCode: 403, message: 'Forbidden' });
    }

    const deleted = await this.adminRepository.deleteById({ id });
    return deleted;
  }
}
