import { Prisma } from 'src/infrastructure/prisma/prisma-client';

type AdminSelectPresetKey = keyof typeof adminSelectPresets;

export function getAdminSelect<K extends AdminSelectPresetKey>(key: K) {
  return adminSelectPresets[key];
}

export const adminSelectPresets = {
  minimal: {
    id: true,
  } satisfies Prisma.AdminSelect,

  general: {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    lastLoginAt: true,
  } satisfies Prisma.AdminSelect,

  withPassword: {
    id: true,
    name: true,
    email: true,
    password: true,
    role: true,
    status: true,
    createdAt: true,
    lastLoginAt: true,
  } satisfies Prisma.AdminSelect,
};
