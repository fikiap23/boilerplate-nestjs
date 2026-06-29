import { Prisma } from 'src/infrastructure/prisma/prisma-client';

type ProductSelectPresetKey = keyof typeof productSelectPresets;

export function getProductSelect<K extends ProductSelectPresetKey>(key: K) {
  return productSelectPresets[key];
}

export const productSelectPresets = {
  minimal: {
    id: true,
    categoryId: true,
  } satisfies Prisma.ProductSelect,

  general: {
    id: true,
    name: true,
    price: true,
    categoryId: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.ProductSelect,
};
