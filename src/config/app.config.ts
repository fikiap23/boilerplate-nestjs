import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10),
  jwtSecret: process.env.JWT_SECRET,
  swaggerUsername: process.env.SWAGGER_USERNAME,
  swaggerPassword: process.env.SWAGGER_PASSWORD,
  cacheDebug: process.env.CACHE_DEBUG === 'true',
}));
