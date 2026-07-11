import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: IPayloadJWT }>();
    const user = request.user;

    if (!user?.role) {
      return false;
    }

    const hasRole = roles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Forbidden resource!');
    }

    return true;
  }
}
