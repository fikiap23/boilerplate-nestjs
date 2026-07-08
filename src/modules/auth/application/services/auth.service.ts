import { Inject, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { EAdminStatus } from 'src/common/enums/admin.enum';
import { JwtHelper } from 'src/common/utils/jwt.helper';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { IAdminRepository } from 'src/modules/admin/domain/repositories/admin.repository.interface';
import { LoginDto } from '../../presentation/dto/login.dto';
import { AuthAuthenticateHelper } from '../../helpers/auth-authenticate.helper';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    private readonly jwtHelper: JwtHelper,
    private readonly authAuthenticateHelper: AuthAuthenticateHelper,
  ) {}

  async handleLogin(dto: LoginDto) {
    const admin = await this.authAuthenticateHelper.authenticate(dto);

    if (admin.getStatus() !== EAdminStatus.ACTIVE) {
      throw new CustomError({
        statusCode: 403,
        message: 'Admin is inactive',
      });
    }

    await this.adminRepository.updateById({
      id: admin.getId(),
      data: {
        lastLoginAt: new Date(),
      },
      invalidate: 'none',
      tags: null,
    });

    const payload: IPayloadJWT = {
      sub: admin.getId(),
      email: admin.getEmail(),
      name: admin.getName(),
      role: admin.getRole(),
      status: admin.getStatus(),
    };

    const { access_token } = await this.jwtHelper.signToken(payload, '7d');

    return {
      accessToken: access_token,
    };
  }
}
