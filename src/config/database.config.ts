import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
  poolIdleTimeoutMs: parseInt(
    process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? '30000',
    10,
  ),
  poolConnectionTimeoutMs: parseInt(
    process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? '5000',
    10,
  ),
}));
