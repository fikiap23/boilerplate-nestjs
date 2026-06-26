import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  sort: Prisma.SortOrder;

  @IsOptional()
  @IsInt()
  page: number;

  @IsOptional()
  @IsInt()
  limit: number;
}

export class SearchPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search: string;
}
