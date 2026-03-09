import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IPayloadJWT } from '../interfaces/auth.interface';
import { AdminRepository } from 'src/admin/repositories/admin.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly adminRepository: AdminRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
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
