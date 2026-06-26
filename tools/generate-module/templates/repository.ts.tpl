import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';

export type {{pascal}}Payload<T extends Prisma.{{pascal}}Select> =
  Prisma.{{pascal}}GetPayload<{
    select: T;
  }>;

type {{pascal}}ToPayload = <T extends Prisma.{{pascal}}Select>(
  data: unknown,
) => {{pascal}}Payload<T>;

export const {{pascal}}Repository = createPrismaRepository<
  Prisma.{{pascal}}Select,
  Prisma.{{pascal}}CreateInput,
  Prisma.{{pascal}}UpdateInput,
  Prisma.{{pascal}}WhereInput,
  Prisma.{{pascal}}OrderByWithRelationInput,
  {{pascal}}ToPayload{{repoModelGeneric}}
>({
{{cacheBlock}}
  getDelegate: (client) => client.{{repoModel}},
  toPayload: <T extends Prisma.{{pascal}}Select>(data: unknown) =>
    data as {{pascal}}Payload<T>,
});

export type {{pascal}}Repository = PrismaRepositoryInstance<
  Prisma.{{pascal}}Select,
  Prisma.{{pascal}}CreateInput,
  Prisma.{{pascal}}UpdateInput,
  Prisma.{{pascal}}WhereInput,
  Prisma.{{pascal}}OrderByWithRelationInput,
  {{pascal}}ToPayload{{repoModelGeneric}}
>;
