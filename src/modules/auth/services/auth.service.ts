import { Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { EAdminStatus } from 'src/common/enums/admin.enum';
import { JwtHelper } from 'src/common/utils/jwt.helper';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';
import { LoginDto } from '../dto/login.dto';
import { AuthAuthenticateHelper } from '../helpers/auth-authenticate.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly jwtHelper: JwtHelper,
    private readonly authAuthenticateHelper: AuthAuthenticateHelper,
  ) {}

  async handleLogin(dto: LoginDto) {
    const admin = await this.authAuthenticateHelper.authenticate(dto);

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
}
