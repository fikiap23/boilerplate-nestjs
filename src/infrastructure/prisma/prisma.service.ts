import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from 'src/infrastructure/prisma/prisma-client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('database.url'),
    });
    super({ adapter });
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
}
