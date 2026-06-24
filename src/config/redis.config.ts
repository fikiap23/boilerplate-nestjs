import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  prefix: process.env.REDIS_PREFIX ?? 'bn',
  defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL ?? '300', 10),
}));
