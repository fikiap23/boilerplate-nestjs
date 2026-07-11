import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = request.headers['x-request-id'] ?? '-';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      this.logger.log(
        JSON.stringify({
          requestId,
          method,
          url: originalUrl,
          statusCode,
          contentLength,
          userAgent,
          ip,
        }),
      );
    });

    next();
  }
}
