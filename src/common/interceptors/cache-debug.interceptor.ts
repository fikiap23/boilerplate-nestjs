import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import {
  cacheDebugStorage,
  isCacheDebugEnabled,
} from 'src/infrastructure/redis/utils/cache-debug.util';

@Injectable()
export class CacheDebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isCacheDebugEnabled()) {
      return next.handle();
    }

    return cacheDebugStorage.run({}, () =>
      next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse<Response>();
          const status = cacheDebugStorage.getStore()?.status ?? 'SKIP';
          response.setHeader('X-Cache', status);
        }),
      ),
    );
  }
}
