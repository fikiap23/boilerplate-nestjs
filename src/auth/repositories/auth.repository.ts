import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { IPayloadJWT } from '../interfaces/auth.interface';
import { Injectable } from '@nestjs/common';
import { AdminRepository } from 'src/admin/repositories/admin.repository';
import { CustomError } from 'utils/errors/custom-error';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) {}

  /**
    Hashes a string value using bcrypt with auto-generated salt
  **/
  async bcryptHash(value: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(value, salt);
    return hash;
  }

  /**
    Authenticates an admin by validating email and password
  **/
  async authAdmin(dto: LoginDto) {
    const { password } = dto;

    const admin = await this.adminRepository.getFirst({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new CustomError({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    return admin;
  }

  /**
    Signs a JWT token with the provided payload
  **/
  async signJwtToken(payload: IPayloadJWT, expiresIn: string) {
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret: process.env.JWT_SECRET,
    });
    return { access_token };
  }

  /**
    Decodes a JWT token and extracts the payload
  **/
  decodeJwtToken(accessToken: string) {
    const decodedJwt: IPayloadJWT = this.jwtService.decode(
      accessToken.split(' ')[1],
    );
    return decodedJwt;
  }
}
