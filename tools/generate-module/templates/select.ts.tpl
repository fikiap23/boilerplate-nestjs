import { Prisma } from 'src/infrastructure/prisma/prisma-client';

type {{pascal}}SelectPresetKey = keyof typeof {{camel}}SelectPresets;

export function get{{pascal}}Select<K extends {{pascal}}SelectPresetKey>(key: K) {
  return {{camel}}SelectPresets[key];
}

export const {{camel}}SelectPresets = {
  minimal: {
    id: true,
  } satisfies Prisma.{{pascal}}Select,

  general: {
    id: true,
  } satisfies Prisma.{{pascal}}Select,
};
