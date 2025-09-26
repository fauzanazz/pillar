import { Context } from 'hono';
import { z } from 'zod';

import { genericSchema } from '@/types/generic.type';

// Factory function to create extended response schema with data
export function createResponseSchema<T extends z.ZodType>(dataSchema?: T) {
  if (!dataSchema) {
    return genericSchema;
  }
  return genericSchema.extend({
    data: dataSchema.optional(),
  });
}

// Helper function to create success response
export function createSuccessResponse<T>(
  data: T,
  message: string,
  code: number = 200,
) {
  return {
    success: true,
    data,
    message,
    code,
  };
}

// Helper function to create error response
export function createErrorResponse(message: string, code: number = 500) {
  return {
    success: false,
    message,
    code,
  };
}

export const GenericErrorResponses = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: createResponseSchema(),
      },
    },
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: createResponseSchema(),
      },
    },
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: createResponseSchema(),
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: createResponseSchema(),
      },
    },
  },
};

export const create200Response = (
  c: Context,
  res: z.infer<typeof genericSchema>,
) => {
  switch (res.code) {
    case 200:
      return c.json(res, 200);
    case 400:
      return c.json(res, 400);
    case 403:
      return c.json(res, 403);
    case 404:
      return c.json(res, 404);
    case 500:
      return c.json(res, 500);
    default:
      return c.json(createErrorResponse('Unexpected error occurred', 500), 500);
  }
};
export const create201Response = (
  c: Context,
  res: z.infer<typeof genericSchema>,
) => {
  switch (res.code) {
    case 201:
      return c.json(res, 201);
    case 400:
      return c.json(res, 400);
    case 403:
      return c.json(res, 403);
    case 404:
      return c.json(res, 404);
    case 500:
      return c.json(res, 500);
    default:
      return c.json(createErrorResponse('Unexpected error occurred', 500), 500);
  }
};

// Type helpers
export type ResponseSchema<T extends z.ZodType> = z.infer<
  ReturnType<typeof createResponseSchema<T>>
>;
export type BaseResponse = z.infer<typeof genericSchema>;
