import { Prisma } from 'src/infrastructure/prisma/prisma-client';

/**
 * Runtime registry for cache validation. Keep in sync with `PrismaSelectPayloadMap`.
 * Generator `--cache` patches this array automatically.
 */
export const PRISMA_SELECT_PAYLOAD_MODEL_KEYS = [
  'admin',
  'category',
  'product',
  'merchant',
] as const;

export type PrismaSelectPayloadMapKey =
  (typeof PRISMA_SELECT_PAYLOAD_MODEL_KEYS)[number];

/**
 * Registry: repo `model` string (cache key) → Prisma Select type.
 * Tambah entry di sini setiap repository baru dengan cache enabled.
 */
export interface PrismaSelectPayloadMap {
  admin: Prisma.AdminSelect;
  category: Prisma.CategorySelect;
  product: Prisma.ProductSelect;
  merchant: Prisma.MerchantSelect;
}

type RepoModel = keyof PrismaSelectPayloadMap;

type GetPayloadForModel<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = {
  admin: Prisma.AdminGetPayload<{ select: TSelect }>;
  category: Prisma.CategoryGetPayload<{ select: TSelect }>;
  product: Prisma.ProductGetPayload<{ select: TSelect }>;
  merchant: Prisma.MerchantGetPayload<{ select: TSelect }>;
}[TRepoModel];

/**
 * Resolves repository return type from `select` shape.
 * Hanya berlaku untuk model yang terdaftar di `PrismaSelectPayloadMap`.
 */
export type PrismaSelectPayload<
  TRepoModel extends RepoModel,
  TSelect extends PrismaSelectPayloadMap[TRepoModel],
> = GetPayloadForModel<TRepoModel, TSelect>;
