import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.enableShutdownHooks();
  app.use(helmet());

  const corsOrigins = configService.get<string[]>('app.corsOrigins', []);
  app.enableCors(
    corsOrigins.length > 0
      ? { origin: corsOrigins, credentials: true }
      : { origin: true },
  );

  const enableSwagger = configService.get<boolean>('app.enableSwagger');
  if (enableSwagger) {
    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [configService.get<string>('app.swaggerUsername')]:
            configService.get<string>('app.swaggerPassword'),
        },
      }),
    );
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', {
    limit: '1mb',
    extended: true,
    parameterLimit: 1000,
  });

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Boilerplate Nest API')
      .setDescription('API Documentation - Auth & Admin sample')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('app.port');
  await app.listen(port);

  const nodeEnv = configService.get<string>('app.nodeEnv');
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Application started',
      port,
      nodeEnv,
      swagger: enableSwagger,
    }),
  );
}

bootstrap();
