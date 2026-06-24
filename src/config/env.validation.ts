import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
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
