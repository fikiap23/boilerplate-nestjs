import { Response } from 'express';
import { ETypeErrorCode } from 'src/common/enums/admin.enum';
import {
  cacheDebugStorage,
  isCacheDebugEnabled,
} from 'src/infrastructure/redis/utils/cache-debug.util';
import {
  IFormatErrorResponse,
  IFormatResponse,
  IMessageStatusCode,
} from 'src/shared/interfaces/http-helper.interface';

function applyCacheDebugHeader(response: Response): void {
  if (!isCacheDebugEnabled()) return;

  const status = cacheDebugStorage.getStore()?.status ?? 'SKIP';
  response.setHeader('X-Cache', status);
}

export const getMessageStatusCode = (status: number): IMessageStatusCode => {
  let isSuccess: boolean = false;
  let message: string;
  switch (status) {
    case 200:
      isSuccess = true;
      message = 'OK';
      break;
    case 201:
      isSuccess = true;
      message = 'CREATED';
      break;
    case 400:
      message = 'BAD_REQUEST';
      break;
    default:
      message = 'NOT_DEFINED';
  }

  return { isSuccess, message };
};

export const formatResponse = (
  response: Response,
  status: number,
  data: any,
  meta?: any,
): Response<any, Record<string, IFormatResponse>> => {
  const { isSuccess, message } = getMessageStatusCode(status);
  const res: IFormatResponse = { isSuccess, message, data, meta };

  applyCacheDebugHeader(response);
  return response.status(status).send(res);
};

export const formatErrorResponse = (
  response: Response,
  message: string,
  statusCode: number,
  errorCode?: ETypeErrorCode,
): Response<any, Record<string, IFormatErrorResponse>> => {
  const res = { isSuccess: false, message, errorCode };

  return response.status(statusCode).send(res);
};
