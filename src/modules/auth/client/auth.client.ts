import { AuthClientResponse } from './auth.response';

export abstract class AuthClient {
  abstract login(email: string, password: string): Promise<AuthClientResponse | null>;
}
