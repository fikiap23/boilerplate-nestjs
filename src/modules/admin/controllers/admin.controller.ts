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

import { JwtGuard, RoleGuard } from 'src/common/guards';
import { CurrentUser, Roles } from 'src/common/decorators';

import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';

import { AdminService } from '../services/admin.service';
import { EAdminRole } from 'src/common/enums/admin.enum';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';

import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
  UpdateProfileAdminDto,
} from '../dto/admin.dto';

import { ApiTags } from '@nestjs/swagger';

import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { validateUUID } from 'src/common/utils/helper.common';

@ApiTags('Admin Management')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(EAdminRole.SUPERADMIN)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create new admin',
    body: CreateAdminDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(
    @CurrentUser() user: IPayloadJWT,
    @Body() dto: CreateAdminDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.adminService.handleCreate(user.sub, dto);
      return formatResponse(res, HttpStatus.CREATED, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(EAdminRole.SUPERADMIN, EAdminRole.ADMIN)
  @Get('paginate')
  @SwaggerEndpoint({
    summary: 'Get admin list with pagination',
    pagination: true,
  })
  async getManyPaginate(@Query() query: FilterAdminDto, @Res() res: Response) {
    try {
      const result = await this.adminService.handleGetManyPaginate(query);
      return formatResponse(res, HttpStatus.OK, result.data, result.meta);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  @SwaggerEndpoint({
    summary: 'Get current admin profile',
  })
  async getProfile(@CurrentUser() user: IPayloadJWT, @Res() res: Response) {
    try {
      const result = await this.adminService.handleGetById(user.sub);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get admin by ID',
    params: [{ name: 'id', description: 'Admin UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'admin');

      const result = await this.adminService.handleGetById(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('profile')
  @SwaggerEndpoint({
    summary: 'Update current admin profile',
    body: UpdateProfileAdminDto,
  })
  async updateProfile(
    @CurrentUser() user: IPayloadJWT,
    @Body() dto: UpdateProfileAdminDto,
    @Res() res: Response,
  ) {
    try {
      await this.adminService.handleUpdateProfile(user.sub, dto);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(EAdminRole.SUPERADMIN)
  @Patch(':id')
  @SwaggerEndpoint({
    summary: 'Update admin by ID',
    body: UpdateAdminDto,
    params: [{ name: 'id', description: 'Admin UUID' }],
  })
  async updateById(
    @CurrentUser() user: IPayloadJWT,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'admin');

      await this.adminService.handleUpdateById(user.sub, id, dto);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(EAdminRole.SUPERADMIN)
  @Delete(':id')
  @SwaggerEndpoint({
    summary: 'Delete admin by ID',
    params: [{ name: 'id', description: 'Admin UUID' }],
  })
  async deleteById(
    @CurrentUser() user: IPayloadJWT,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'admin');

      await this.adminService.handleDeleteById(user.sub, id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
