import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { splitSelect } from 'src/common/utils/helper.common';

type MerchantSelectPresetKey = keyof typeof merchantSelectPresets;

export function getMerchantSelect<K extends MerchantSelectPresetKey>(key: K) {
  return merchantSelectPresets[key];
}

export const merchantSelectPresets = {
  minimal: {
    id: true,
  } satisfies Prisma.MerchantSelect,

  general: {
    id: true,
    name: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.MerchantSelect,
};

export function splitMerchantSelect<T extends Prisma.MerchantSelect>(
  select: T,
) {
  return splitSelect(select, Prisma.MerchantScalarFieldEnum);
}
