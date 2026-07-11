import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { RedisService } from 'src/infrastructure/redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.redis.isReady()) {
      return indicator.down({ message: 'Redis is not connected' });
    }

    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return indicator.down({ message: 'Unexpected Redis ping response' });
      }
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: (error as Error).message,
      });
    }
  }
}
