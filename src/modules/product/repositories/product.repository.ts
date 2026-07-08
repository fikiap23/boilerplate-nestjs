import { forwardRef } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';
import { CacheTags } from 'src/common/utils/cache-tag.util';
import { ProductComposeHelper } from '../helpers/product-compose.helper';

export type ProductPayload<T extends Prisma.ProductSelect> =
  Prisma.ProductGetPayload<{
    select: T;
  }>;

type ProductToPayload = <T extends Prisma.ProductSelect>(
  data: unknown,
) => ProductPayload<T>;

export const ProductRepository = createPrismaRepository<
  Prisma.ProductSelect,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput,
  Prisma.ProductOrderByWithRelationInput,
  ProductToPayload,
  'product'
>({
  model: 'product',
  cache: {
    ttl: 60 * 60 * 24,
    nullTtl: 60,
    sensitiveFields: [],
    methods: {
      getManyPaginate: { ttl: 60 * 60 * 24 },
      getMany: { ttl: 60 * 60 * 24 },
    },
    getTags: (product: any) => CacheTags.shop(product.merchantId),
  },
  getDelegate: (client) => client.product,
  toPayload: <T extends Prisma.ProductSelect>(data: unknown) =>
    data as ProductPayload<T>,
  scalarFields: Prisma.ProductScalarFieldEnum,
  composeHelperToken: forwardRef(() => ProductComposeHelper),
});

export type ProductRepository = PrismaRepositoryInstance<
  Prisma.ProductSelect,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput,
  Prisma.ProductOrderByWithRelationInput,
  ProductToPayload,
  'product'
>;
