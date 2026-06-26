import type { Admin } from '../../src/generated/prisma/client';

export type IAdmin = Pick<
  Admin,
  'name' | 'email' | 'password' | 'role' | 'status'
>;
