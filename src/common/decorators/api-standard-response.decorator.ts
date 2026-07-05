import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiStandardResponseOptions<T extends Type<unknown>> {
  model?: T;
  isArray?: boolean;
  status?: number;
  description?: string;
}

export function ApiStandardResponse<T extends Type<unknown>>(
  options: ApiStandardResponseOptions<T> = {},
) {
  const {
    model,
    isArray = false,
    status = 200,
    description = 'Successful response',
  } = options;

  const dataSchema = model
    ? isArray
      ? { type: 'array', items: { $ref: getSchemaPath(model) } }
      : { $ref: getSchemaPath(model) }
    : { type: 'object', nullable: true, example: null };

  const decorators = [
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: status },
          message: { type: 'string', example: description },
          data: dataSchema,
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string', example: '/api/v1/...' },
        },
      },
    }),
  ];

  if (model) {
    decorators.unshift(ApiExtraModels(model));
  }

  return applyDecorators(...decorators);
}
