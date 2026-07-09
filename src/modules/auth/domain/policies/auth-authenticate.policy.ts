import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { compareBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminClient } from 'src/modules/admin/client/admin.client';
import { LoginDto } from '../../presentation/dto/login.dto';
import { EAdminStatus } from 'src/common/enums/admin.enum';

@Injectable()
export class AuthAuthenticatePolicy {
  constructor(private readonly adminClient: AdminClient) {}

  async authenticate(dto: LoginDto) {
    const admin = await this.adminClient.getAdminByEmailForAuth(dto.email);

    if (!admin) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await compareBcrypt(dto.password, admin.passwordHash);
    if (!isMatch) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    return admin;
  }

  assertAdminActive(status: string): void {
    if (status !== EAdminStatus.ACTIVE) {
      throw new CustomError({
        statusCode: 403,
        message: 'Admin is inactive',
      });
    }
  }
}
