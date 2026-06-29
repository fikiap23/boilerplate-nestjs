import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  cacheDebugStorage,
  isCacheDebugEnabled,
} from 'src/infrastructure/redis/utils/cache-debug.util';

@Injectable()
export class CacheDebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (!isCacheDebugEnabled()) {
      return next.handle();
    }

    return cacheDebugStorage.run({}, () => next.handle());
  }
}
