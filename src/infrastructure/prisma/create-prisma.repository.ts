import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginateFunction, paginator } from 'prisma/paginator/paginator';
import { IPaginatedResult } from 'prisma/interfaces/paginated-result';
import { PrismaService } from './prisma.service';
import { PrismaModelDelegate } from './types/prisma-delegate.type';
import { InferRepositoryPayload } from './types/infer-repository-payload.type';

const paginate: PaginateFunction = paginator({});

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

export function createPrismaRepository<
  TSelect extends object,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderBy,
  TToPayload extends <T extends TSelect>(data: unknown) => unknown,
>(options: {
  getDelegate: (client: PrismaClientLike) => PrismaModelDelegate;
  toPayload: TToPayload;
}) {
  type Payload<T extends TSelect> = InferRepositoryPayload<
    TSelect,
    T,
    TToPayload
  >;

  const getModel = (prisma: PrismaService, tx?: Prisma.TransactionClient) =>
    options.getDelegate(tx ?? prisma);

  @Injectable()
  class PrismaRepository {
    constructor(public readonly prisma: PrismaService) {}

    async create<T extends TSelect>({
      tx,
      data,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      data: TCreateInput;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).create({ data, select });
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).findUnique({
        where: { id },
        select,
      });
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getThrowById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).findUniqueOrThrow({
        where: { id },
        select,
      });
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getFirst<T extends TSelect>({
      tx,
      where,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).findFirst({ where, select });
      return options.toPayload<T>(result) as Payload<T>;
    }

    async getMany<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      take,
      skip,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      take?: number;
      skip?: number;
    }): Promise<Payload<T>[]> {
      const results = await getModel(this.prisma, tx).findMany({
        where,
        select,
        orderBy,
        take,
        skip,
      });
      return results.map((item) => options.toPayload<T>(item) as Payload<T>);
    }

    async getManyPaginate<T extends TSelect>({
      tx,
      where,
      select,
      orderBy,
      page = 1,
      limit = 10,
    }: {
      tx?: Prisma.TransactionClient;
      where?: TWhereInput;
      select?: T;
      orderBy?: TOrderBy;
      page?: number;
      limit?: number;
    }): Promise<IPaginatedResult<Payload<T>>> {
      return paginate(
        getModel(this.prisma, tx),
        { where, select, orderBy },
        { page, perPage: limit },
      ) as Promise<IPaginatedResult<Payload<T>>>;
    }

    async updateById<T extends TSelect>({
      tx,
      id,
      data,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      data: TUpdateInput;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).update({
        where: { id },
        data,
        select,
      });
      return options.toPayload<T>(result) as Payload<T>;
    }

    async deleteById<T extends TSelect>({
      tx,
      id,
      select,
    }: {
      tx?: Prisma.TransactionClient;
      id: string;
      select?: T;
    }): Promise<Payload<T>> {
      const result = await getModel(this.prisma, tx).delete({
        where: { id },
        select,
      });
      return options.toPayload<T>(result) as Payload<T>;
    }
  }

  return PrismaRepository;
}

export type PrismaRepositoryInstance<
  TSelect extends object,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderBy,
  TToPayload extends <T extends TSelect>(data: unknown) => unknown,
> = InstanceType<
  ReturnType<
    typeof createPrismaRepository<
      TSelect,
      TCreateInput,
      TUpdateInput,
      TWhereInput,
      TOrderBy,
      TToPayload
    >
  >
>;
