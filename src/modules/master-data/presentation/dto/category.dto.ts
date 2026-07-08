import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';
import { Category } from '../../domain/entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'electronics' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug?: string;
}

export class FilterCategoryDto extends SearchPaginationDto {}

export class CategoryResponseDto {
  @ApiProperty({ example: 'uuid-of-category' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  createdAt?: Date;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  updatedAt?: Date;

  static fromDomain(domain: Category): CategoryResponseDto {
    if (!domain) return null;
    return {
      id: domain.getId(),
      name: domain.getName(),
      slug: domain.getSlug(),
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    };
  }
}
