import { createRoute } from '@hono/zod-openapi';
import z from 'zod';

import { GenericErrorResponses } from '@/lib';
import {
  alertWithContractResponseSchema,
  alertsListResponseSchema,
  createAlertSchema,
  getAlertsQuerySchema,
  markAlertAsReadSchema,
} from '@/types/alert.type';

export const getAlertsRoute = createRoute({
  operationId: 'getAlerts',
  tags: ['alerts'],
  method: 'get',
  path: '/alerts',
  request: {
    query: getAlertsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of alerts retrieved successfully',
      content: {
        'application/json': {
          schema: alertsListResponseSchema,
        },
      },
    },
  },
  ...GenericErrorResponses,
});

export const getAlertByIdRoute = createRoute({
  operationId: 'getAlertById',
  tags: ['alerts'],
  method: 'get',
  path: '/alerts/{id}',
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
  },
  responses: {
    200: {
      description: 'Alert retrieved successfully',
      content: {
        'application/json': {
          schema: alertWithContractResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const markAlertAsReadRoute = createRoute({
  operationId: 'markAlertAsRead',
  tags: ['alerts'],
  method: 'patch',
  path: '/alerts/{id}/read',
  request: {
    params: z.object({
      id: z.string().transform((val) => parseInt(val, 10)),
    }),
    body: {
      content: {
        'application/json': {
          schema: markAlertAsReadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Alert marked as read successfully',
      content: {
        'application/json': {
          schema: alertWithContractResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const getUnreadAlertsCountRoute = createRoute({
  operationId: 'getUnreadAlertsCount',
  tags: ['alerts'],
  method: 'get',
  path: '/alerts/unread/count',
  responses: {
    200: {
      description: 'Unread alerts count retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.number(),
            message: z.string(),
            code: z.number().default(200),
          }),
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const createAlertRoute = createRoute({
  operationId: 'createAlert',
  tags: ['alerts'],
  method: 'post',
  path: '/alerts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createAlertSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Alert created successfully',
      content: {
        'application/json': {
          schema: alertWithContractResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});
