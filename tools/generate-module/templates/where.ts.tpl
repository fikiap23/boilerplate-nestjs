import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { Filter{{pascal}}Dto } from '../dto/{{kebab}}.dto';

export function where{{pascal}}GetManyPaginate(_filter: Filter{{pascal}}Dto): {
  where: Prisma.{{pascal}}WhereInput;
} {
  // TODO: add filters — see src/modules/admin/types/where-admin.type.ts
  return { where: {} };
}
