import { Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { EAdminStatus } from 'src/common/enums/admin.enum';
import { compareBcrypt } from 'src/common/utils/bcrypt.util';
import { JwtHelper } from 'src/common/utils/jwt.helper';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly jwtHelper: JwtHelper,
  ) {}

  /**
    Processes admin login by authenticating credentials, checking status, updating last login, and generating JWT
  **/
  async handleLogin(dto: LoginDto) {
    const admin = await this.authenticateAdmin(dto);

    if (admin.status !== EAdminStatus.ACTIVE) {
      throw new CustomError({
        statusCode: 403,
        message: 'Admin is inactive',
      });
    }

    await this.adminRepository.updateById({
      id: admin.id,
      data: {
        lastLoginAt: new Date(),
      },
      invalidate: 'none',
    });

    const payload: IPayloadJWT = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
    };

    const { access_token } = await this.jwtHelper.signToken(payload, '7d');

    return {
      accessToken: access_token,
    };
  }

  private async authenticateAdmin(dto: LoginDto) {
    const { password, email } = dto;

    const admin = await this.adminRepository.getFirst({
      where: { email },
      skipCache: true,
    });

    if (!admin) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await compareBcrypt(password, admin.password);
    if (!isMatch) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    return admin;
  }
}
