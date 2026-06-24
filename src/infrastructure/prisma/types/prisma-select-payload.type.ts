import { Prisma } from '@prisma/client';

/**
 * Registry: repo `model` string (cache key) → Prisma Select type.
 * Tambah entry di sini setiap repository baru dengan cache enabled.
 */
export interface PrismaSelectPayloadMap {
  admin: Prisma.AdminSelect;
  // feature: Prisma.FeatureSelect;
}

type RepoModel = keyof PrismaSelectPayloadMap;

type GetPayloadForModel<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = {
  admin: Prisma.AdminGetPayload<{ select: TSelect }>;
  // feature: Prisma.FeatureGetPayload<{ select: TSelect }>;
}[TRepoModel];

/**
 * Resolves repository return type from `select` shape.
 * Hanya berlaku untuk model yang terdaftar di `PrismaSelectPayloadMap`.
 */
export type PrismaSelectPayload<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = GetPayloadForModel<TRepoModel, TSelect>;
