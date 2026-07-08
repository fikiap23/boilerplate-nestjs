import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';
import { Product } from '../../domain/entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 999.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'This is a description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'uuid-of-merchant' })
  @IsUUID()
  merchantId: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 1099.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'This is an updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-merchant' })
  @IsOptional()
  @IsUUID()
  merchantId?: string;
}

export class FilterProductDto extends SearchPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by merchant ID' })
  @IsOptional()
  @IsUUID()
  merchantId?: string;
}

export class ProductAssociatedCategoryDto {
  @ApiProperty({ example: 'uuid-of-category' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;
}

export class ProductAssociatedMerchantDto {
  @ApiProperty({ example: 'uuid-of-merchant' })
  id: string;

  @ApiProperty({ example: 'Awesome Shop' })
  name: string;

  @ApiProperty({ example: 'awesome-shop' })
  slug: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-of-product' })
  id: string;

  @ApiProperty({ example: 'iPhone 15' })
  name: string;

  @ApiProperty({ example: 'This is a description' })
  description: string | null;

  @ApiProperty({ example: 999.99 })
  price: number;

  @ApiProperty({ example: 100 })
  stock: number;

  @ApiProperty({ example: 'uuid-of-category' })
  categoryId: string;

  @ApiProperty({ example: 'uuid-of-merchant' })
  merchantId: string;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  createdAt?: Date;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  updatedAt?: Date;

  @ApiPropertyOptional({ type: () => ProductAssociatedCategoryDto })
  category?: ProductAssociatedCategoryDto;

  @ApiPropertyOptional({ type: () => ProductAssociatedMerchantDto })
  merchant?: ProductAssociatedMerchantDto;

  static fromDomain(domain: Product): ProductResponseDto {
    if (!domain) return null;
    return {
      id: domain.getId(),
      name: domain.getName(),
      description: domain.getDescription(),
      price: domain.getPrice().getValue(),
      stock: domain.getStock().getValue(),
      categoryId: domain.getCategoryId(),
      merchantId: domain.getMerchantId(),
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
      category: domain.getCategory()
        ? {
            id: domain.getCategory().id,
            name: domain.getCategory().name,
            slug: domain.getCategory().slug,
          }
        : undefined,
      merchant: domain.getMerchant()
        ? {
            id: domain.getMerchant().id,
            name: domain.getMerchant().name,
            slug: domain.getMerchant().slug,
          }
        : undefined,
    };
  }
}
