import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const INDEX_TTL_BUFFER = 60;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private prefix: string;
  private ready = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('redis.url');
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    this.prefix = this.configService.get<string>('redis.prefix', 'bn');

    this.client = url
      ? new Redis(url, { lazyConnect: true })
      : new Redis({ host, port, lazyConnect: true });

    this.client.on('ready', () => {
      this.ready = true;
    });
    this.client.on('error', (err) => {
      this.ready = false;
      this.logger.error('Redis connection error', err.message);
    });
    this.client.on('close', () => {
      this.ready = false;
    });

    this.client.connect().catch((err) => {
      this.logger.error('Redis failed to connect', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  isReady(): boolean {
    return this.ready;
  }

  getPrefix(): string {
    return this.prefix;
  }

  // --- low-level ops (may throw) ---

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.client.del(...keys);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async setNx(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Atomically SET a cache key + SADD into an index SET + EXPIRE the index.
   * Single round-trip via pipeline.
   */
  async setWithIndex(
    key: string,
    value: unknown,
    ttlSeconds: number,
    indexKey: string,
  ): Promise<void> {
    const pipeline = this.client.pipeline();
    pipeline.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    pipeline.sadd(indexKey, key);
    pipeline.expire(indexKey, ttlSeconds + INDEX_TTL_BUFFER);
    await pipeline.exec();
  }

  async invalidateByIndex(indexKey: string): Promise<void> {
    const keys = await this.smembers(indexKey);
    if (keys.length > 0) {
      await this.del(...keys, indexKey);
    } else {
      await this.del(indexKey);
    }
  }

  // --- safe wrappers (never throw — log + return fallback) ---

  async safeGet<T>(key: string): Promise<T | null> {
    try {
      return await this.get<T>(key);
    } catch (err) {
      this.logger.warn(`safeGet failed for key=${key}`, (err as Error).message);
      return null;
    }
  }

  async safeSetWithIndex(
    key: string,
    value: unknown,
    ttlSeconds: number,
    indexKey: string,
  ): Promise<void> {
    try {
      await this.setWithIndex(key, value, ttlSeconds, indexKey);
    } catch (err) {
      this.logger.warn(
        `safeSetWithIndex failed for key=${key}`,
        (err as Error).message,
      );
    }
  }

  async safeInvalidateByIndex(indexKey: string): Promise<void> {
    try {
      await this.invalidateByIndex(indexKey);
    } catch (err) {
      this.logger.warn(
        `safeInvalidateByIndex failed for idx=${indexKey}`,
        (err as Error).message,
      );
    }
  }

  async safeSetNx(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      return await this.setNx(key, ttlSeconds);
    } catch (err) {
      this.logger.warn(
        `safeSetNx failed for key=${key}`,
        (err as Error).message,
      );
      return false;
    }
  }

  async safeDel(...keys: string[]): Promise<void> {
    try {
      await this.del(...keys);
    } catch (err) {
      this.logger.warn(`safeDel failed`, (err as Error).message);
    }
  }

  async safeSet(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.set(key, value, ttlSeconds);
    } catch (err) {
      this.logger.warn(`safeSet failed for key=${key}`, (err as Error).message);
    }
  }

  async safeSaddAndExpire(
    key: string,
    members: string[],
    ttlSeconds: number,
  ): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      pipeline.sadd(key, ...members);
      pipeline.expire(key, ttlSeconds + INDEX_TTL_BUFFER);
      await pipeline.exec();
    } catch (err) {
      this.logger.warn(
        `safeSaddAndExpire failed for key=${key}`,
        (err as Error).message,
      );
    }
  }

  async safeSmembers(key: string): Promise<string[]> {
    try {
      return await this.smembers(key);
    } catch (err) {
      this.logger.warn(
        `safeSmembers failed for key=${key}`,
        (err as Error).message,
      );
      return [];
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}
