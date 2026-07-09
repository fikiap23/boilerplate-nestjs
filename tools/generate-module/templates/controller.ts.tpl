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

import { Get{{pascal}}ByIdUseCase } from '../../application/use-cases/get-{{kebab}}-by-id.use-case';
import { {{pascal}}ResponseDto } from '../dto/{{kebab}}.dto';

@ApiTags('{{pascal}} Management')
@Controller('{{route}}')
export class {{pascal}}Controller {
  constructor(private readonly get{{pascal}}ByIdUseCase: Get{{pascal}}ByIdUseCase) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get {{kebab}} by ID',
    params: [{ name: 'id', description: '{{pascal}} UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, '{{kebab}}');
      const result = await this.get{{pascal}}ByIdUseCase.execute(id);
      return formatResponse(
        res,
        HttpStatus.OK,
        {{pascal}}ResponseDto.fromDomain(result),
      );
    } catch (error) {
      return errorHandler(res, error);
    }
  }

  // TODO: add more endpoints — see src/modules/admin/presentation/controllers/admin.controller.ts
}
