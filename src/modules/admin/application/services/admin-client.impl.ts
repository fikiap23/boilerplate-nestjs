import { Injectable } from '@nestjs/common';
import { AdminClient } from '../../client/admin.client';
import {
  AdminClientResponse,
  AdminAuthResponse,
} from '../../client/admin.response';
import { GetAdminByIdUseCase } from '../use-cases/get-admin-by-id.use-case';
import { GetAdminByEmailForAuthUseCase } from '../use-cases/get-admin-by-email-for-auth.use-case';
import { UpdateAdminLastLoginUseCase } from '../use-cases/update-admin-last-login.use-case';

@Injectable()
export class AdminClientImpl implements AdminClient {
  constructor(
    private readonly getAdminByIdUseCase: GetAdminByIdUseCase,
    private readonly getAdminByEmailForAuthUseCase: GetAdminByEmailForAuthUseCase,
    private readonly updateAdminLastLoginUseCase: UpdateAdminLastLoginUseCase,
  ) {}

  async getAdminById(id: string): Promise<AdminClientResponse | null> {
    try {
      const admin = await this.getAdminByIdUseCase.execute(id);
      if (!admin) return null;
      return {
        id: admin.getId(),
        name: admin.getName(),
        email: admin.getEmail(),
        role: admin.getRole(),
        status: admin.getStatus(),
      };
    } catch {
      return null;
    }
  }

  async getAdminByEmailForAuth(
    email: string,
  ): Promise<AdminAuthResponse | null> {
    try {
      const admin = await this.getAdminByEmailForAuthUseCase.execute(email);
      if (!admin) return null;
      return {
        id: admin.getId(),
        name: admin.getName(),
        email: admin.getEmail(),
        passwordHash: admin.getPassword() || '',
        role: admin.getRole(),
        status: admin.getStatus(),
      };
    } catch {
      return null;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.updateAdminLastLoginUseCase.execute(id);
  }
}
