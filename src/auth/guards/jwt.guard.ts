import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { formatErrorResponse } from 'helpers/http.helper';
import { Response } from 'express';

export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const response = context.switchToHttp().getResponse<Response>();

    if (err || !user) {
      formatErrorResponse(response, 'Forbidden resource!', 401);
      throw new Error('Forbidden resource!');
    }

    return user;
  }
}
