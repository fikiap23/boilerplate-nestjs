import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly adminRepository: AdminRepository,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('app.jwtSecret'),
    });
  }

  async validate(payload: IPayloadJWT) {
    const userAdmin = await this.adminRepository.getById({
      id: payload.sub,
    });
    if (userAdmin) return true;
    return false;
  }
}
