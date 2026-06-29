import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { compareBcrypt } from 'src/common/utils/bcrypt.util';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';
import { getAdminSelect } from 'src/modules/admin/types/select-admin.type';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthAuthenticateHelper {
  constructor(private readonly adminRepository: AdminRepository) {}

  async authenticate(dto: LoginDto) {
    const admin = await this.adminRepository.getFirst({
      where: { email: dto.email },
      select: getAdminSelect('withPassword'),
      skipCache: true,
    });

    if (!admin) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await compareBcrypt(dto.password, admin.password);
    if (!isMatch) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    return admin;
  }
}
