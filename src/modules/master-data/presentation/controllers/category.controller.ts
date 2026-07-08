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

import { JwtGuard } from 'src/common/guards';
import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';
import { validateUUID } from 'src/common/utils/helper.common';

import { CategoryService } from '../../application/services/category.service';
import {
  CreateCategoryDto,
  FilterCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from '../dto/category.dto';

@ApiTags('Master Data - Category')
@Controller('master-data/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtGuard)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create category',
    body: CreateCategoryDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(@Body() dto: CreateCategoryDto, @Res() res: Response) {
    try {
      const result = await this.categoryService.handleCreate(dto);
      return formatResponse(
        res,
        HttpStatus.CREATED,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
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
      const result = await this.categoryService.handleGetManyPaginate(query);
      const mappedData = result.data.map((item) =>
        CategoryResponseDto.fromDomain(item),
      );
      return formatResponse(res, HttpStatus.OK, mappedData, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get category by ID',
    params: [{ name: 'id', description: 'Category UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'category');

      const result = await this.categoryService.handleGetById(id);
      return formatResponse(
        res,
        HttpStatus.OK,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
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

      const result = await this.categoryService.handleUpdateById(id, dto);
      return formatResponse(
        res,
        HttpStatus.OK,
        CategoryResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete category by ID',
    params: [{ name: 'id', description: 'Category UUID' }],
  })
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'category');

      await this.categoryService.handleDeleteById(id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
