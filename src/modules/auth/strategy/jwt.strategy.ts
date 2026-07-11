import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EAdminStatus } from 'src/common/enums/admin.enum';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { AdminClient } from 'src/modules/admin/client/admin.client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly adminClient: AdminClient,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('app.jwtSecret'),
    });
  }

  async validate(payload: IPayloadJWT) {
    const userAdmin = await this.adminClient.getAdminById(payload.sub);
    if (!userAdmin || userAdmin.status !== EAdminStatus.ACTIVE) {
      return false;
    }

    return {
      sub: userAdmin.id,
      email: userAdmin.email,
      name: userAdmin.name,
      role: userAdmin.role,
      status: userAdmin.status,
    };
  }
}
