import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { JwtGuard, RoleGuard } from 'src/auth/guards';
import { Roles } from 'src/auth/decorator';
import { AuthRepository } from 'src/auth/repositories/auth.repository';

import { formatResponse } from 'helpers/http.helper';
import { errorHandler } from 'helpers/validation.helper';

import { AdminService } from '../services/admin.service';
import { EAdminRole } from 'utils/enum';

import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
  UpdateProfileAdminDto,
} from '../dto/admin.dto';

import { ApiTags } from '@nestjs/swagger';

import { SwaggerEndpoint } from 'helpers/common/swagger/swagger';
import { validateUUID } from 'helpers/common/helper.common';

@ApiTags('Admin Management')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authRepository: AuthRepository,
  ) {}

  @UseGuards(JwtGuard, RoleGuard)
  @Roles(EAdminRole.SUPERADMIN)
  @Post()
  @SwaggerEndpoint({
    summary: 'Create new admin',
    body: CreateAdminDto,
    success: { status: 201, description: 'Created successfully' },
  })
  async create(
    @Body() dto: CreateAdminDto,
    @Headers('authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      const { sub } = this.authRepository.decodeJwtToken(authorization);
      const result = await this.adminService.handleCreate(sub, dto);
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
  async getProfile(
    @Headers('authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      const { sub } = this.authRepository.decodeJwtToken(authorization);
      const result = await this.adminService.handleGetById(sub);
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
    @Headers('authorization') authorization: string,
    @Body() dto: UpdateProfileAdminDto,
    @Res() res: Response,
  ) {
    try {
      const { sub } = this.authRepository.decodeJwtToken(authorization);
      await this.adminService.handleUpdateProfile(sub, dto);
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
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
    @Headers('authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'admin');

      const { sub } = this.authRepository.decodeJwtToken(authorization);
      await this.adminService.handleUpdateById(sub, id, dto);
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
    @Param('id') id: string,
    @Headers('authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      validateUUID(id, 'admin');

      const { sub } = this.authRepository.decodeJwtToken(authorization);
      await this.adminService.handleDeleteById(sub, id);
      return formatResponse(res, HttpStatus.OK, null);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
