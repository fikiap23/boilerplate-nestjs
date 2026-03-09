import { Prisma, PrismaClient } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient {
  /**
    Executes a callback function within a Prisma database transaction

    @param fn - Async callback receiving a Prisma TransactionClient and returning a result
    @returns Promise resolving to the callback's return value
  **/
  async execTx<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await this.$transaction(async (tx: Prisma.TransactionClient) => {
      return await fn(tx);
    });
  }
}
