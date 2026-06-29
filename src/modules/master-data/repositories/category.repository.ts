import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';

export type CategoryPayload<T extends Prisma.CategorySelect> =
  Prisma.CategoryGetPayload<{
    select: T;
  }>;

type CategoryToPayload = <T extends Prisma.CategorySelect>(
  data: unknown,
) => CategoryPayload<T>;

export const CategoryRepository = createPrismaRepository<
  Prisma.CategorySelect,
  Prisma.CategoryCreateInput,
  Prisma.CategoryUpdateInput,
  Prisma.CategoryWhereInput,
  Prisma.CategoryOrderByWithRelationInput,
  CategoryToPayload,
  'category'
>({
  model: 'category',
  cache: {
    ttl: 300,
    nullTtl: 60,
    sensitiveFields: [],
    methods: {
      getManyPaginate: { ttl: 60 },
      getMany: { ttl: 60 },
    },
  },
  getDelegate: (client) => client.category,
  toPayload: <T extends Prisma.CategorySelect>(data: unknown) =>
    data as CategoryPayload<T>,
});

export type CategoryRepository = PrismaRepositoryInstance<
  Prisma.CategorySelect,
  Prisma.CategoryCreateInput,
  Prisma.CategoryUpdateInput,
  Prisma.CategoryWhereInput,
  Prisma.CategoryOrderByWithRelationInput,
  CategoryToPayload,
  'category'
>;
