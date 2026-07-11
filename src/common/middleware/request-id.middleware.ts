import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();

    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-Id', requestId);
    next();
  }
}
