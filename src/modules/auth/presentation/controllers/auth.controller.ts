import { Response } from 'express';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { formatResponse } from 'src/common/utils/http.helper';
import { errorHandler } from 'src/common/utils/validation.helper';
import { SwaggerEndpoint } from 'src/common/decorators/swagger-endpoint.decorator';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LoginDto } from '../dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @SwaggerEndpoint({
    summary: 'Login admin and return JWT token',
    auth: false,
    body: LoginDto,
  })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.loginUseCase.execute(dto);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
