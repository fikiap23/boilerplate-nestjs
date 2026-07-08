import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export type CategorySelectPresetKey = keyof typeof categorySelectPresets;

export function getCategorySelect<K extends CategorySelectPresetKey>(key: K) {
  return categorySelectPresets[key];
}

export const categorySelectPresets = {
  minimal: {
    id: true,
    slug: true,
  } satisfies Prisma.CategorySelect,

  general: {
    id: true,
    name: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.CategorySelect,
};
