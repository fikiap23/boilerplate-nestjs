import { Prisma } from 'src/infrastructure/prisma/prisma-client';

/**
 * Registry: repo `model` string (cache key) → Prisma Select type.
 * Tambah entry di sini setiap repository baru dengan cache enabled.
 */
export interface PrismaSelectPayloadMap {
  admin: Prisma.AdminSelect;
  category: Prisma.CategorySelect;
  product: Prisma.ProductSelect;
}

type RepoModel = keyof PrismaSelectPayloadMap;

type GetPayloadForModel<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = {
  admin: Prisma.AdminGetPayload<{ select: TSelect }>;
  category: Prisma.CategoryGetPayload<{ select: TSelect }>;
  product: Prisma.ProductGetPayload<{ select: TSelect }>;
}[TRepoModel];

/**
 * Resolves repository return type from `select` shape.
 * Hanya berlaku untuk model yang terdaftar di `PrismaSelectPayloadMap`.
 */
export type PrismaSelectPayload<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = GetPayloadForModel<TRepoModel, TSelect>;
