import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
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

import { MerchantService } from '../services/merchant.service';
import {
  CreateMerchantDto,
  FilterMerchantDto,
  UpdateMerchantDto,
} from '../dto/merchant.dto';

@ApiTags('Merchant Management')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @UseGuards(JwtGuard)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create merchant',
    body: CreateMerchantDto,
  })
  async create(@Body() dto: CreateMerchantDto, @Res() res: Response) {
    try {
      const result = await this.merchantService.handleCreate(dto);
      return formatResponse(res, HttpStatus.CREATED, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('paginate')
  @SwaggerEndpoint({
    summary: 'Get merchant list with pagination',
    pagination: true,
    queryDto: FilterMerchantDto,
  })
  async getManyPaginate(
    @Query() query: FilterMerchantDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.merchantService.handleGetManyPaginate(query);
      return formatResponse(res, HttpStatus.OK, result.data, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get merchant by ID',
    params: [{ name: 'id', description: 'Merchant UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'merchant');
      const result = await this.merchantService.handleGetById(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Put(':id')
  @SwaggerEndpoint({
    summary: 'Update merchant by ID',
    params: [{ name: 'id', description: 'Merchant UUID' }],
    body: UpdateMerchantDto,
  })
  async updateById(
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'merchant');
      const result = await this.merchantService.handleUpdateById(id, dto);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete merchant by ID',
    params: [{ name: 'id', description: 'Merchant UUID' }],
  })
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'merchant');
      const result = await this.merchantService.handleDeleteById(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
