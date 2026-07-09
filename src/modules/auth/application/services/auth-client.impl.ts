import { Injectable } from '@nestjs/common';
import { AuthClient } from '../../client/auth.client';
import { AuthClientResponse } from '../../client/auth.response';
import { LoginUseCase } from '../use-cases/login.use-case';

@Injectable()
export class AuthClientImpl implements AuthClient {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  async login(
    email: string,
    password: string,
  ): Promise<AuthClientResponse | null> {
    try {
      return await this.loginUseCase.execute({ email, password });
    } catch {
      return null;
    }
  }
}
