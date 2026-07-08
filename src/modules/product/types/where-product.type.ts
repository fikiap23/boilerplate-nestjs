import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { FilterProductDto } from '../presentation/dto/product.dto';

export function whereProductGetManyPaginate(filter: FilterProductDto): {
  where: Prisma.ProductWhereInput;
} {
  const { search, categoryId, merchantId } = filter;

  const where: Prisma.ProductWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(merchantId ? { merchantId } : {}),
  };

  return { where };
}
