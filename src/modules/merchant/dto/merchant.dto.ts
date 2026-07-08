import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';

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
