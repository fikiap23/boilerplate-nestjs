import { Response } from 'express';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { formatResponse } from 'helpers/http.helper';
import { errorHandler } from 'helpers/validation.helper';
import { SwaggerEndpoint } from 'helpers/common/swagger/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @SwaggerEndpoint({
    summary: 'Login admin and return JWT token',
    auth: false,
    body: LoginDto,
  })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.handleLogin(dto);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
