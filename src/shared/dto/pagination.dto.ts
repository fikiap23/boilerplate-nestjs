import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const MAX_PAGE_SIZE = 100;

export class PaginationDto {
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  sort: Prisma.SortOrder;

  @IsOptional()
  @IsInt()
  @Min(1)
  page: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number;
}

export class SearchPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search: string;
}

export { MAX_PAGE_SIZE };
