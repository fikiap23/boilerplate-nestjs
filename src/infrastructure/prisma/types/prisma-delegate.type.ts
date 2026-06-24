export type PrismaModelDelegate = {
  create: (args: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  findUniqueOrThrow: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown | null>;
  findMany: (args: unknown) => Promise<unknown[]>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  count: (args: unknown) => Promise<number>;
};
