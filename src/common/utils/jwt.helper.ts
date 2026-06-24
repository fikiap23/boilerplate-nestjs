import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';

@Injectable()
export class JwtHelper {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signToken(payload: IPayloadJWT, expiresIn: string) {
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret: this.configService.get<string>('app.jwtSecret'),
    });
    return { access_token };
  }

  decodeToken(accessToken: string): IPayloadJWT {
    const decodedJwt: IPayloadJWT = this.jwtService.decode(
      accessToken.split(' ')[1],
    );
    return decodedJwt;
  }
}
