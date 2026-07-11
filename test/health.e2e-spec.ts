import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import * as request from 'supertest';
import { HealthController } from 'src/modules/health/presentation/controllers/health.controller';
import { RedisHealthIndicator } from 'src/modules/health/infrastructure/indicators/redis.health-indicator';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

describe('Health endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $runCommandRaw: jest
              .fn()
              .mockRejectedValue(
                new Error('Use the mongodb provider for this database'),
              ),
            $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue({
              redis: { status: 'up' },
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns 200', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /ready returns 200 when dependencies are healthy', async () => {
    await request(app.getHttpServer()).get('/ready').expect(200);
  });
});
