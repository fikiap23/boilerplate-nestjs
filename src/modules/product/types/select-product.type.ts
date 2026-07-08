import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { splitSelect } from 'src/common/utils/helper.common';

export const productSelectPresets = {
  minimal: {
    id: true,
    categoryId: true,
    merchantId: true,
  } satisfies Prisma.ProductSelect,

  general: {
    id: true,
    name: true,
    price: true,
    categoryId: true,
    merchantId: true,
    createdAt: true,
    updatedAt: true,
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    merchant: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  } satisfies Prisma.ProductSelect,
};

type ProductSelectPresetKey = keyof typeof productSelectPresets;

export function getProductSelect<K extends ProductSelectPresetKey>(key: K) {
  return productSelectPresets[key];
}

export function splitProductSelect<T extends Prisma.ProductSelect>(select: T) {
  return splitSelect(select, Prisma.ProductScalarFieldEnum);
}
