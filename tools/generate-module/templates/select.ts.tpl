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
    // TODO: add fields — see src/modules/admin/types/select-admin.type.ts
    {{generalFields}}
  } satisfies Prisma.{{pascal}}Select{{withPasswordPreset}},
};
