import { Injectable } from '@nestjs/common';
import { AuthClient } from '../../client/auth.client';
import { AuthClientResponse } from '../../client/auth.response';
import { AuthService } from './auth.service';

@Injectable()
export class AuthClientImpl implements AuthClient {
  constructor(private readonly authService: AuthService) {}

  async login(
    email: string,
    password: string,
  ): Promise<AuthClientResponse | null> {
    try {
      return await this.authService.handleLogin({ email, password });
    } catch {
      return null;
    }
  }
}
