import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { FilterCategoryDto } from '../presentation/dto/category.dto';

export function whereCategoryGetManyPaginate(filter: FilterCategoryDto): {
  where: Prisma.CategoryWhereInput;
} {
  const { search } = filter;

  const where: Prisma.CategoryWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return { where };
}
