import { Prisma } from '@prisma/client';

/**
 * Maps repository `model` option to Prisma GetPayload for a given select shape.
 * Extend when adding new cached repositories.
 */
export type PrismaSelectPayload<
  TRepoModel extends string,
  TSelect extends object,
> = TRepoModel extends 'admin'
  ? Prisma.AdminGetPayload<{ select: TSelect }>
  : never;
