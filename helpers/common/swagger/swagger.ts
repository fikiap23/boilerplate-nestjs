import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

type SwaggerError = {
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500;
  message?: string | string[];
};

type SwaggerParam = {
  name: string;
  description?: string;
  required?: boolean;
};

type SwaggerQuery = {
  name: string;
  required?: boolean;
  example?: any;
};

type SwaggerEndpointOptions = {
  summary: string;
  auth?: boolean;
  success?: {
    status?: number;
    description?: string;
  };
  body?: any;
  queryDto?: any;
  params?: SwaggerParam[];
  queries?: SwaggerQuery[];
  pagination?: boolean;
  errors?: SwaggerError[];
};

const ERROR_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Validation Error',
  500: 'Internal Server Error',
};

/**
  Creates a composite Swagger decorator for endpoint documentation
**/
export const SwaggerEndpoint = ({
  summary,
  auth = true,
  success = { status: 200, description: 'Success' },
  body,
  queryDto,
  params = [],
  queries = [],
  pagination = false,
  errors = [],
}: SwaggerEndpointOptions) => {
  const decorators = [
    ApiOperation({ summary }),
    ApiResponse({
      status: success.status ?? 200,
      description: success.description ?? 'Success',
    }),
  ];

  if (auth) decorators.push(ApiBearerAuth());

  if (body) {
    decorators.push(ApiBody({ type: body }));
  }

  if (queryDto) {
    decorators.push(ApiQuery({ type: queryDto }));
  }

  params.forEach((p) =>
    decorators.push(
      ApiParam({
        name: p.name,
        required: p.required ?? true,
        description: p.description,
      }),
    ),
  );

  if (pagination) {
    decorators.push(
      ApiQuery({ name: 'page', required: false, example: 1 }),
      ApiQuery({ name: 'limit', required: false, example: 10 }),
      ApiQuery({ name: 'sort', required: false, example: 'asc' }),
      ApiQuery({ name: 'search', required: false }),
    );
  }

  queries.forEach((q) =>
    decorators.push(
      ApiQuery({
        name: q.name,
        required: q.required ?? false,
        example: q.example,
      }),
    ),
  );

  errors.forEach(({ status, message }) => {
    const messages = Array.isArray(message)
      ? message
      : [message || ERROR_TEXT[status]];

    const examples = messages.reduce(
      (acc, msg, i) => {
        acc[`case${i + 1}`] = {
          value: {
            isSuccess: false,
            message: msg,
          },
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    decorators.push(
      ApiResponse({
        status,
        description: ERROR_TEXT[status],
        content: {
          'application/json': {
            examples,
          },
        },
      }),
    );
  });

  return applyDecorators(...decorators);
};
