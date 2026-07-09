import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
    const userAdmin = await this.adminClient.getAdmin(payload.sub);
    if (userAdmin) return payload;
    return false;
  }
}
