import { Inject, Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { compareBcrypt } from 'src/common/utils/bcrypt.util';
import { IAdminRepository } from 'src/modules/admin/domain/repositories/admin.repository.interface';
import { getAdminSelect } from 'src/modules/admin/types/select-admin.type';
import { LoginDto } from '../presentation/dto/login.dto';

@Injectable()
export class AuthAuthenticateHelper {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async authenticate(dto: LoginDto) {
    const admin = await this.adminRepository.getFirst({
      where: { email: dto.email },
      select: getAdminSelect('withPassword'),
    });

    if (!admin) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await compareBcrypt(dto.password, admin.getPassword());
    if (!isMatch) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    return admin;
  }
}
