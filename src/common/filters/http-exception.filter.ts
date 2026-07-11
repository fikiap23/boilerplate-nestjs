import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { CustomError } from 'src/common/exceptions/custom-error';
import { formatErrorResponse } from 'src/common/utils/http.helper';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof CustomError) {
      return formatErrorResponse(
        response,
        exception.message,
        exception.statusCode,
      );
    }

    if (exception instanceof ThrottlerException) {
      return formatErrorResponse(response, 'Too many requests', 429);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ??
            exception.message);

      return formatErrorResponse(
        response,
        Array.isArray(message) ? message.join(', ') : String(message),
        status,
      );
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const statusMap: Record<string, number> = {
        P2002: 409,
        P2003: 400,
        P2014: 400,
        P2016: 400,
        P2025: 404,
      };
      const statusCode = statusMap[exception.code] ?? 400;
      return formatErrorResponse(response, exception.message, statusCode);
    }

    if (
      exception instanceof Error &&
      exception.message === 'Forbidden resource!'
    ) {
      const statusCode = response.statusCode === 403 ? 403 : 401;
      return formatErrorResponse(response, exception.message, statusCode);
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    return formatErrorResponse(
      response,
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
