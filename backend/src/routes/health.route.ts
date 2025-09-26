import { createRoute } from '@hono/zod-openapi';

import { healthSchema, protectedHealthSchema } from '@/types/health.type';

export const healthRoute = createRoute({
  operationId: 'health',
  tags: ['health'],
  method: 'get',
  path: '/health',
  request: {},
  responses: {
    200: {
      description: 'Health check successful',
      content: {
        'application/json': {
          schema: healthSchema,
        },
      },
    },
  },
});

export const protectedHealthRoute = createRoute({
  operationId: 'protectedhealth',
  tags: ['health'],
  method: 'get',
  path: '/health/protected',
  request: {},
  responses: {
    200: {
      description: 'Protected Health check successful',
      content: {
        'application/json': {
          schema: protectedHealthSchema,
        },
      },
    },
  },
});
