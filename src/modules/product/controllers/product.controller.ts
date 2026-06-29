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

import { ProductService } from '../services/product.service';
import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from '../dto/product.dto';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtGuard)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create product',
    body: CreateProductDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(@Body() dto: CreateProductDto, @Res() res: Response) {
    try {
      const result = await this.productService.handleCreate(dto);
      return formatResponse(res, HttpStatus.CREATED, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('paginate')
  @SwaggerEndpoint({
    summary: 'Get product list with pagination',
    pagination: true,
  })
  async getManyPaginate(
    @Query() query: FilterProductDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.productService.handleGetManyPaginate(query);
      return formatResponse(res, HttpStatus.OK, result.data, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get product by ID',
    params: [{ name: 'id', description: 'Product UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'product');

      const result = await this.productService.handleGetById(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  @SwaggerEndpoint({
    summary: 'Update product by ID',
    body: UpdateProductDto,
    params: [{ name: 'id', description: 'Product UUID' }],
  })
  async updateById(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'product');

      const result = await this.productService.handleUpdateById(id, dto);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete product by ID',
    params: [{ name: 'id', description: 'Product UUID' }],
  })
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'product');

      await this.productService.handleDeleteById(id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
