import { Prisma, PrismaClient } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient {
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
