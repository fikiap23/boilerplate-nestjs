import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT, 10),
  jwtSecret: process.env.JWT_SECRET,
  swaggerUsername: process.env.SWAGGER_USERNAME,
  swaggerPassword: process.env.SWAGGER_PASSWORD,
  cacheDebug: process.env.CACHE_DEBUG === 'true',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  enableSwagger:
    process.env.ENABLE_SWAGGER === 'true' ||
    (process.env.ENABLE_SWAGGER !== 'false' &&
      (process.env.NODE_ENV ?? 'development') !== 'production'),
  throttleTtl: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));
