import { Injectable } from '@nestjs/common';
import { CustomError } from 'utils/errors/custom-error';
import { IPayloadJWT } from './interfaces/auth.interface';
import { AuthRepository } from './repositories/auth.repository';
import { LoginDto } from './dto/login.dto';
import { AdminRepository } from 'src/admin/repositories/admin.repository';
import { EAdminStatus } from 'utils/enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly adminRepository: AdminRepository,
  ) {}

  /**
    Processes admin login by authenticating credentials, checking status, updating last login, and generating JWT
  **/
  async handleLogin(dto: LoginDto) {
    const admin = await this.authRepository.authAdmin(dto);

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
    });

    const payload: IPayloadJWT = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
    };

    const { access_token } = await this.authRepository.signJwtToken(
      payload,
      '7d',
    );

    return {
      accessToken: access_token,
    };
  }
}
