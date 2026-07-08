import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { FilterAdminDto } from '../presentation/dto/admin.dto';

export function whereAdminGetManyPaginate(filter: FilterAdminDto): {
  where: Prisma.AdminWhereInput;
} {
  const { search, status, role } = filter;

  const where: Prisma.AdminWhereInput = {
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
  };

  return { where };
}
