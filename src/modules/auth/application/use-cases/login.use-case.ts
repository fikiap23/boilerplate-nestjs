import { Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import { EAdminStatus } from 'src/common/enums/admin.enum';
import { JwtHelper } from 'src/common/utils/jwt.helper';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { AdminClient } from 'src/modules/admin/client/admin.client';
import { LoginDto } from '../../presentation/dto/login.dto';
import { AuthAuthenticatePolicy } from '../../domain/policies/auth-authenticate.policy';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly adminClient: AdminClient,
    private readonly jwtHelper: JwtHelper,
    private readonly authAuthenticatePolicy: AuthAuthenticatePolicy,
  ) {}

  async execute(dto: LoginDto) {
    const admin = await this.authAuthenticatePolicy.authenticate(dto);

    if (admin.status !== EAdminStatus.ACTIVE) {
      throw new CustomError({
        statusCode: 403,
        message: 'Admin is inactive',
      });
    }

    await this.adminClient.updateLastLogin(admin.id);

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
