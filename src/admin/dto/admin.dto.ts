import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EAdminRole, EAdminStatus } from 'utils/enum';
import { SearchPaginationDto } from 'utils/pagination.dto';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin1', description: 'Admin name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin@example.com', description: 'Admin email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Admin password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: EAdminRole, description: 'Admin role' })
  @IsOptional()
  @IsEnum(EAdminRole)
  role?: EAdminRole;

  @ApiPropertyOptional({ enum: EAdminStatus, description: 'Admin status' })
  @IsOptional()
  @IsEnum(EAdminStatus)
  status?: EAdminStatus;
}

export class UpdateAdminDto {
  @ApiPropertyOptional({ description: 'Admin name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Admin email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Admin password' })
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: EAdminRole, description: 'Admin role' })
  @IsOptional()
  @IsEnum(EAdminRole)
  role?: EAdminRole;

  @ApiPropertyOptional({ enum: EAdminStatus, description: 'Admin status' })
  @IsOptional()
  @IsEnum(EAdminStatus)
  status?: EAdminStatus;
}

export class UpdateProfileAdminDto {
  @ApiPropertyOptional({ description: 'Admin name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Admin email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Old password for verification' })
  @IsOptional()
  oldPassword?: string;

  @ApiPropertyOptional({ description: 'New password to update' })
  @IsOptional()
  newPassword?: string;
}

export class FilterAdminDto extends SearchPaginationDto {
  @ApiPropertyOptional({ enum: EAdminRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(EAdminRole)
  role?: EAdminRole;

  @ApiPropertyOptional({ enum: EAdminStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(EAdminStatus)
  status?: EAdminStatus;
}
