import { Injectable } from '@nestjs/common';
import { AdminClient } from '../../client/admin.client';
import { AdminClientResponse } from '../../client/admin.response';
import { AdminService } from './admin.service';

@Injectable()
export class AdminClientImpl implements AdminClient {
  constructor(private readonly adminService: AdminService) {}

  async getAdmin(id: string): Promise<AdminClientResponse | null> {
    try {
      const admin = await this.adminService.handleGetById(id);
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
}
