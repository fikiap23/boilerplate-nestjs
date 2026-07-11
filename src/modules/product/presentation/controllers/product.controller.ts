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
import { MANAGEMENT_WRITE_ROLES } from 'src/common/constants/role.constants';
import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';
import { validateUUID } from 'src/common/utils/helper.common';

import {
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../dto/product.dto';

// Use Cases
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { GetProductManyPaginateUseCase } from '../../application/use-cases/get-product-many-paginate.use-case';
import { UpdateProductByIdUseCase } from '../../application/use-cases/update-product-by-id.use-case';
import { DeleteProductByIdUseCase } from '../../application/use-cases/delete-product-by-id.use-case';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getProductManyPaginateUseCase: GetProductManyPaginateUseCase,
    private readonly updateProductByIdUseCase: UpdateProductByIdUseCase,
    private readonly deleteProductByIdUseCase: DeleteProductByIdUseCase,
  ) {}

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create product',
    body: CreateProductDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(@Body() dto: CreateProductDto, @Res() res: Response) {
    try {
      const result = await this.createProductUseCase.execute(dto);
      return formatResponse(
        res,
        HttpStatus.CREATED,
        ProductResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

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
      const result = await this.getProductManyPaginateUseCase.execute(query);
      const mappedData = result.data.map((item) =>
        ProductResponseDto.fromDomain(item),
      );
      return formatResponse(res, HttpStatus.OK, mappedData, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get product by ID',
    params: [{ name: 'id', description: 'Product UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'product');

      const result = await this.getProductByIdUseCase.execute(id);
      return formatResponse(
        res,
        HttpStatus.OK,
        ProductResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
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

      const result = await this.updateProductByIdUseCase.execute(id, dto);
      return formatResponse(
        res,
        HttpStatus.OK,
        ProductResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(...MANAGEMENT_WRITE_ROLES)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete product by ID',
    params: [{ name: 'id', description: 'Product UUID' }],
  })
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'product');

      await this.deleteProductByIdUseCase.execute(id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
