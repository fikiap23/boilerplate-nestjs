import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';
import { {{pascal}} } from '../../domain/entities/{{kebab}}.entity';

export class Create{{pascal}}Dto {
  @ApiProperty({ example: 'My Name' })
  @IsString()
  @MinLength(1)
  name: string;
}

export class Filter{{pascal}}Dto extends SearchPaginationDto {}

export class {{pascal}}ResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'My Name' })
  name: string;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;

  static fromDomain(domain: {{pascal}}): {{pascal}}ResponseDto {
    if (!domain) return null;
    return {
      id: domain.getId(),
      name: domain.getName(),
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    };
  }
}
