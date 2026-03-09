import { Admin } from '@prisma/client';

export type IAdmin = Pick<
  Admin,
  'name' | 'email' | 'password' | 'role' | 'status'
>;
