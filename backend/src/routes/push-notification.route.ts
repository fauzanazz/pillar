import { createRoute } from '@hono/zod-openapi';
import z from 'zod';

import { GenericErrorResponses } from '@/lib';

// VAPID public key response schema
const vapidPublicKeyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    publicKey: z.string(),
  }),
  message: z.string(),
  code: z.number(),
});

// Test notification response schema
const testNotificationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    message: z.string(),
    notification: z.object({
      title: z.string(),
      body: z.string(),
      icon: z.string().optional(),
      badge: z.string().optional(),
      tag: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    }),
    instructions: z.array(z.string()),
  }),
  message: z.string(),
  code: z.number(),
});

// Push notification simulation response schema
const simulateNotificationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    message: z.string(),
    notification: z.object({
      title: z.string(),
      body: z.string(),
      icon: z.string().optional(),
      badge: z.string().optional(),
      tag: z.string().optional(),
      data: z.record(z.string(), z.any()).optional(),
    }),
    exampleSubscription: z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    }),
    note: z.string(),
  }),
  message: z.string(),
  code: z.number(),
});

export const getVapidPublicKeyRoute = createRoute({
  operationId: 'getVapidPublicKey',
  tags: ['push-notifications'],
  method: 'get',
  path: '/push/vapid-key',
  responses: {
    200: {
      description: 'VAPID public key retrieved successfully',
      content: {
        'application/json': {
          schema: vapidPublicKeyResponseSchema,
        },
      },
    },
  },
  ...GenericErrorResponses,
});

export const testPushNotificationRoute = createRoute({
  operationId: 'testPushNotification',
  tags: ['push-notifications'],
  method: 'post',
  path: '/push/test',
  responses: {
    200: {
      description: 'Test push notification created successfully',
      content: {
        'application/json': {
          schema: testNotificationResponseSchema,
        },
      },
    },
  },
  ...GenericErrorResponses,
});

export const simulatePushNotificationRoute = createRoute({
  operationId: 'simulatePushNotification',
  tags: ['push-notifications'],
  method: 'post',
  path: '/push/simulate',
  responses: {
    200: {
      description: 'Push notification simulation completed successfully',
      content: {
        'application/json': {
          schema: simulateNotificationResponseSchema,
        },
      },
    },
  },
  ...GenericErrorResponses,
});

// Subscription request schema
const subscriptionRequestSchema = z.object({
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

// Subscribe to push notifications route
export const subscribeToPushNotificationsRoute = createRoute({
  operationId: 'subscribeToPushNotifications',
  tags: ['push-notifications'],
  method: 'post',
  path: '/push/subscribe',
  request: {
    body: {
      content: {
        'application/json': {
          schema: subscriptionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully subscribed to push notifications',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              message: z.string(),
            }),
            message: z.string(),
            code: z.number(),
          }),
        },
      },
    },
  },
  ...GenericErrorResponses,
});

// Unsubscribe from push notifications route
export const unsubscribeFromPushNotificationsRoute = createRoute({
  operationId: 'unsubscribeFromPushNotifications',
  tags: ['push-notifications'],
  method: 'post',
  path: '/push/unsubscribe',
  responses: {
    200: {
      description: 'Successfully unsubscribed from push notifications',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              message: z.string(),
            }),
            message: z.string(),
            code: z.number(),
          }),
        },
      },
    },
  },
  ...GenericErrorResponses,
});
