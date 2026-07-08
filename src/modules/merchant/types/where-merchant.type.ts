import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { FilterMerchantDto } from '../dto/merchant.dto';

export function whereMerchantGetManyPaginate(filter: FilterMerchantDto): {
  where: Prisma.MerchantWhereInput;
} {
  const { search } = filter;
  const where: Prisma.MerchantWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };
  return { where };
}
