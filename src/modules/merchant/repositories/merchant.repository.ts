import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';

export type MerchantPayload<T extends Prisma.MerchantSelect> =
  Prisma.MerchantGetPayload<{
    select: T;
  }>;

type MerchantToPayload = <T extends Prisma.MerchantSelect>(
  data: unknown,
) => MerchantPayload<T>;

export const MerchantRepository = createPrismaRepository<
  Prisma.MerchantSelect,
  Prisma.MerchantCreateInput,
  Prisma.MerchantUpdateInput,
  Prisma.MerchantWhereInput,
  Prisma.MerchantOrderByWithRelationInput,
  MerchantToPayload,
  'merchant'
>({
  model: 'merchant',
  cache: {
    ttl: 300,
    nullTtl: 60,
    sensitiveFields: ['password'],
    methods: {
      getManyPaginate: { ttl: 60 },
      getMany: { ttl: 60 },
    },
  },
  getDelegate: (client) => client.merchant,
  toPayload: <T extends Prisma.MerchantSelect>(data: unknown) =>
    data as MerchantPayload<T>,
});

export type MerchantRepository = PrismaRepositoryInstance<
  Prisma.MerchantSelect,
  Prisma.MerchantCreateInput,
  Prisma.MerchantUpdateInput,
  Prisma.MerchantWhereInput,
  Prisma.MerchantOrderByWithRelationInput,
  MerchantToPayload,
  'merchant'
>;
