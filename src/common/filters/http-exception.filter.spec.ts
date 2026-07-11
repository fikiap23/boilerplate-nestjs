import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { CustomError } from 'src/common/exceptions/custom-error';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createHost = (response: Partial<Response>) =>
    ({
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  it('formats CustomError responses', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new CustomError({ statusCode: 403, message: 'Forbidden' }),
      createHost({ headersSent: false, status } as unknown as Response),
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      isSuccess: false,
      message: 'Forbidden',
      errorCode: undefined,
    });
  });

  it('formats throttler errors', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new ThrottlerException(),
      createHost({ headersSent: false, status } as unknown as Response),
    );

    expect(status).toHaveBeenCalledWith(429);
    expect(send).toHaveBeenCalledWith({
      isSuccess: false,
      message: 'Too many requests',
      errorCode: undefined,
    });
  });

  it('skips when response headers are already sent', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new CustomError({ statusCode: 400, message: 'Bad request' }),
      createHost({ headersSent: true, status } as unknown as Response),
    );

    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('formats unknown errors as 500', () => {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new Error('boom'),
      createHost({ headersSent: false, status } as unknown as Response),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(send).toHaveBeenCalledWith({
      isSuccess: false,
      message: 'Internal server error',
      errorCode: undefined,
    });
  });
});
