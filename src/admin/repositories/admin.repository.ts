import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginateFunction, paginator } from 'prisma/paginator/paginator';

const paginate: PaginateFunction = paginator({});

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create<T extends Prisma.AdminSelect>({
    tx,
    data,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    data: Prisma.AdminCreateInput;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.create({
      data,
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }

  async getById<T extends Prisma.AdminSelect>({
    tx,
    id,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    id: string;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.findUnique({
      where: { id },
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }

  async getThrowById<T extends Prisma.AdminSelect>({
    tx,
    id,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    id: string;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.findUniqueOrThrow({
      where: { id },
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }

  async getFirst<T extends Prisma.AdminSelect>({
    tx,
    where,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    where?: Prisma.AdminWhereInput;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.findFirst({
      where,
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }

  async getMany<T extends Prisma.AdminSelect>({
    tx,
    where,
    select,
    orderBy,
    take,
    skip,
  }: {
    tx?: Prisma.TransactionClient;
    where?: Prisma.AdminWhereInput;
    select?: T;
    orderBy?: Prisma.AdminOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.findMany({
      where,
      select,
      orderBy,
      take,
      skip,
    })) as Prisma.AdminGetPayload<{ select: T }>[];
  }

  async getManyPaginate<T extends Prisma.AdminSelect>({
    tx,
    where,
    select,
    orderBy,
    page = 1,
    limit = 10,
  }: {
    tx?: Prisma.TransactionClient;
    where?: Prisma.AdminWhereInput;
    select?: T;
    orderBy?: Prisma.AdminOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const prisma = tx ?? this.prisma;
    return paginate(
      prisma.admin,
      { where, select, orderBy },
      { page, perPage: limit },
    );
  }

  async updateById<T extends Prisma.AdminSelect>({
    tx,
    id,
    data,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    id: string;
    data: Prisma.AdminUpdateInput;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.update({
      where: { id },
      data,
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }

  async deleteById<T extends Prisma.AdminSelect>({
    tx,
    id,
    select,
  }: {
    tx?: Prisma.TransactionClient;
    id: string;
    select?: T;
  }) {
    const prisma = tx ?? this.prisma;
    return (await prisma.admin.delete({
      where: { id },
      select,
    })) as Prisma.AdminGetPayload<{ select: T }>;
  }
}
