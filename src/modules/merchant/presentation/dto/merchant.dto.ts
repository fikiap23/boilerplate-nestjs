import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';
import { Merchant } from '../../domain/entities/merchant.entity';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Starbucks Store' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'starbucks-store' })
  @IsString()
  @MinLength(1)
  slug: string;
}

export class UpdateMerchantDto {
  @ApiPropertyOptional({ example: 'Starbucks Store Premium' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'starbucks-store-premium' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;
}

export class FilterMerchantDto extends SearchPaginationDto {}

export class MerchantResponseDto {
  @ApiProperty({ example: 'uuid-of-merchant' })
  id: string;

  @ApiProperty({ example: 'Starbucks Store' })
  name: string;

  @ApiProperty({ example: 'starbucks-store' })
  slug: string;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  createdAt?: Date;

  @ApiProperty({ example: '2026-07-08T12:00:00.000Z' })
  updatedAt?: Date;

  static fromDomain(domain: Merchant): MerchantResponseDto {
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
