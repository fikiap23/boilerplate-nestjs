import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JwtGuard, RoleGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import {
  MANAGEMENT_READ_ROLES,
  MANAGEMENT_WRITE_ROLES,
} from 'src/common/constants/role.constants';
import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';
import { validateUUID } from 'src/common/utils/helper.common';

import {
  CreateCategoryDto,
  FilterCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from '../dto/category.dto';

// Use Cases
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { GetCategoryByIdUseCase } from '../../application/use-cases/get-category-by-id.use-case';
import { GetCategoryManyPaginateUseCase } from '../../application/use-cases/get-category-many-paginate.use-case';
import { UpdateCategoryByIdUseCase } from '../../application/use-cases/update-category-by-id.use-case';
import { DeleteCategoryByIdUseCase } from '../../application/use-cases/delete-category-by-id.use-case';

@ApiTags('Master Data - Category')
@Controller('master-data/category')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getCategoryManyPaginateUseCase: GetCategoryManyPaginateUseCase,
    private readonly updateCategoryByIdUseCase: UpdateCategoryByIdUseCase,
    private readonly deleteCategoryByIdUseCase: DeleteCategoryByIdUseCase,
  ) {}

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create category',
    body: CreateCategoryDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(@Body() dto: CreateCategoryDto, @Res() res: Response) {
    try {
      const result = await this.createCategoryUseCase.execute(dto);
      return formatResponse(
        res,
        HttpStatus.CREATED,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_READ_ROLES)
  @Get('paginate')
  @SwaggerEndpoint({
    summary: 'Get category list with pagination',
    pagination: true,
  })
  async getManyPaginate(
    @Query() query: FilterCategoryDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.getCategoryManyPaginateUseCase.execute(query);
      const mappedData = result.data.map((item) =>
        CategoryResponseDto.fromDomain(item),
      );
      return formatResponse(res, HttpStatus.OK, mappedData, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_READ_ROLES)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get category by ID',
    params: [{ name: 'id', description: 'Category UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'category');

      const result = await this.getCategoryByIdUseCase.execute(id);
      return formatResponse(
        res,
        HttpStatus.OK,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
  @Patch(':id')
  @SwaggerEndpoint({
    summary: 'Update category by ID',
    body: UpdateCategoryDto,
    params: [{ name: 'id', description: 'Category UUID' }],
  })
  async updateById(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'category');

      const result = await this.updateCategoryByIdUseCase.execute(id, dto);
      return formatResponse(
        res,
        HttpStatus.OK,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete category by ID',
    params: [{ name: 'id', description: 'Category UUID' }],
  })
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'category');

      await this.deleteCategoryByIdUseCase.execute(id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
