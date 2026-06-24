import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private prefix: string;
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

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', err.message);
    });

    this.client.connect().catch((err) => {
      this.logger.error('Redis failed to connect', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getPrefix(): string {
    return this.prefix;
  }

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

  /**
   * Deletes all keys tracked in an index SET, then deletes the index itself.
   */
  async invalidateByIndex(indexKey: string): Promise<void> {
    const keys = await this.smembers(indexKey);
    if (keys.length > 0) {
      await this.del(...keys, indexKey);
    } else {
      await this.del(indexKey);
    }
  }
}
