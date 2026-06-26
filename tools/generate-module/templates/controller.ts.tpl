import { Response } from 'express';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JwtGuard } from 'src/common/guards';
import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';
import { validateUUID } from 'src/common/utils/helper.common';

import { {{pascal}}Service } from '../services/{{kebab}}.service';

@ApiTags('{{pascal}} Management')
@Controller('{{route}}')
export class {{pascal}}Controller {
  constructor(private readonly {{camel}}Service: {{pascal}}Service) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get {{kebab}} by ID',
    params: [{ name: 'id', description: '{{pascal}} UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, '{{kebab}}');
      const result = await this.{{camel}}Service.handleGetById(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  // TODO: add more endpoints — see src/modules/admin/controllers/admin.controller.ts
}
