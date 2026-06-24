import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';
import { formatErrorResponse } from 'src/common/utils/http.helper';
import { Response } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  matchRoles(roles: string[], userRole: string, response: Response) {
    const match = roles.some((role) => role === userRole);
    if (!match) {
      formatErrorResponse(response, 'Forbidden resource!', 403);
      throw new Error('Forbidden resource!');
    }
    return match;
  }

  canActivate(context: ExecutionContext): boolean {
    const response = context.switchToHttp().getResponse<Response>();

    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      return false;
    }

    const decodedJwt = this.jwtService.decode(token) as IPayloadJWT;
    const userRole = decodedJwt.role;

    return this.matchRoles(roles, userRole, response);
  }
}
