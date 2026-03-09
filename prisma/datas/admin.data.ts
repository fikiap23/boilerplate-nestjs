import { IAdmin } from 'prisma/interfaces/prisma.interface';

export const AdminDatas: IAdmin[] = [
  {
    name: 'Superadmin',
    email: 'superadmin@example.com',
    password: process.env.SUPER_ADMIN_PASSWORD_SEED || 'Superadmin123!',
    status: 'ACTIVE',
    role: 'SUPERADMIN',
  },
];
