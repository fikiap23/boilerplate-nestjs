import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from 'src/infrastructure/prisma/prisma-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>('database.url'),
      max: configService.get<number>('database.poolMax', 10),
      idleTimeoutMillis: configService.get<number>(
        'database.poolIdleTimeoutMs',
        30_000,
      ),
      connectionTimeoutMillis: configService.get<number>(
        'database.poolConnectionTimeoutMs',
        5_000,
      ),
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  /**
   * Executes a callback within a Prisma database transaction.
   * The optional `afterCommit` runs only after the transaction commits successfully —
   * use it to invalidate cache so stale data is never served after rollback.
   */
  async execTx<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    afterCommit?: () => Promise<void>,
  ): Promise<T> {
    const result = await this.$transaction(
      async (tx: Prisma.TransactionClient) => {
        return await fn(tx);
      },
    );
    if (afterCommit) await afterCommit();
    return result;
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
