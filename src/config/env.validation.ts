import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  })
  JWT_SECRET: string;

  @IsInt()
  @Min(1)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  SWAGGER_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PASSWORD: string;

  @IsString()
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  ENABLE_SWAGGER?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PREFIX?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_DEFAULT_TTL?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  DATABASE_POOL_MAX?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    throw new Error(
      `Environment validation failed:\n${messages.map((m) => `- ${m}`).join('\n')}`,
    );
  }

  return validatedConfig;
}
