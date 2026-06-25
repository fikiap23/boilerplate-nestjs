import { Prisma } from '@prisma/client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';

export type AdminPayload<T extends Prisma.AdminSelect> = Prisma.AdminGetPayload<{
  select: T;
}>;

type AdminToPayload = <T extends Prisma.AdminSelect>(
  data: unknown,
) => AdminPayload<T>;

export const AdminRepository = createPrismaRepository<
  Prisma.AdminSelect,
  Prisma.AdminCreateInput,
  Prisma.AdminUpdateInput,
  Prisma.AdminWhereInput,
  Prisma.AdminOrderByWithRelationInput,
  AdminToPayload,
  'admin'
>({
  model: 'admin',
  lock: {
    tableName: 'admin',
    columns: { createdAt: 'created_at', lastLoginAt: 'last_login_at' },
  },
  cache: {
    enabled: true,
    ttl: 300,
    nullTtl: 60,
    sensitiveFields: ['password'],
    methods: {
      getManyPaginate: { ttl: 60 },
      getMany: { ttl: 60 },
    },
  },
  getDelegate: (client) => client.admin,
  toPayload: <T extends Prisma.AdminSelect>(data: unknown) =>
    data as AdminPayload<T>,
});

export type AdminRepository = PrismaRepositoryInstance<
  Prisma.AdminSelect,
  Prisma.AdminCreateInput,
  Prisma.AdminUpdateInput,
  Prisma.AdminWhereInput,
  Prisma.AdminOrderByWithRelationInput,
  AdminToPayload,
  'admin'
>;
