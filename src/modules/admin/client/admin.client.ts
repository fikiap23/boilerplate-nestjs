import { AdminClientResponse, AdminAuthResponse } from './admin.response';

export abstract class AdminClient {
  abstract getAdminById(id: string): Promise<AdminClientResponse | null>;
  abstract getAdminByEmailForAuth(
    email: string,
  ): Promise<AdminAuthResponse | null>;
  abstract updateLastLogin(id: string): Promise<void>;
}
