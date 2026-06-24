import * as _ from 'lodash';
import { Response } from 'express';
import { formatErrorResponse } from './http.helper';
import { CustomError } from 'src/common/exceptions/custom-error';
import { Prisma } from '@prisma/client';

export const isEmpty = (value: any) => {
  return _.isEmpty(value);
};

export const errorHandler = (response: Response, error: any) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const statusMap: Record<string, number> = {
      P2002: 409,
      P2003: 400,
      P2014: 400,
      P2016: 400,
      P2025: 404,
    };

    const statusCode = statusMap[error.code] ?? 400;

    return formatErrorResponse(response, error.message, statusCode);
  }

  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'message' in error
  ) {
    const { statusCode, message, errorCode } = error;
    return formatErrorResponse(response, message, statusCode, errorCode);
  }

  if (
    error &&
    typeof error.error === 'object' &&
    'statusCode' in error.error &&
    'message' in error.error
  ) {
    const { statusCode, message, errorCode } = error.error;
    return formatErrorResponse(response, message, statusCode, errorCode);
  }

  console.error(error);
  return formatErrorResponse(response, 'Internal server error', 500);
};
