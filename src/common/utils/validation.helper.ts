import * as _ from 'lodash';
import { Response } from 'express';
import { CustomError } from 'src/common/exceptions/custom-error';
import { formatErrorResponse } from './http.helper';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export const isEmpty = (value: any) => {
  return _.isEmpty(value);
};

const formatPrismaErrorMessage = (
  error: Prisma.PrismaClientKnownRequestError,
): string => {
  const target = (error.meta?.target as string[]) || [];
  const field = (error.meta?.field_name as string) || '';

  switch (error.code) {
    case 'P2002': {
      if (target.length > 0) {
        const formattedFields = target.map((t) => _.startCase(t)).join(', ');
        return `${formattedFields} already exists`;
      }
      return 'Unique constraint failed';
    }
    case 'P2003': {
      if (field) {
        const cleanedField = field.replace('_fkey', '').replace(/_id$/, 'Id');
        return `Related record for field '${cleanedField}' does not exist`;
      }
      return 'Foreign key constraint failed';
    }
    case 'P2025': {
      const cause = error.meta?.cause as string;
      if (cause) {
        return cause;
      }
      return 'Record not found';
    }
    default: {
      const lines = error.message.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        return lastLine.replace(/^→\s*/, '').trim();
      }
      return error.message;
    }
  }
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
    const cleanMessage = formatPrismaErrorMessage(error);

    return formatErrorResponse(response, cleanMessage, statusCode);
  }

  if (error instanceof CustomError) {
    const { statusCode, message } = error;
    return formatErrorResponse(response, message, statusCode);
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
