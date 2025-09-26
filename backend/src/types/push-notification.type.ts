import z from 'zod';

import { createResponseSchema } from '@/lib/response-factory';

// Push subscription schema
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const createPushSubscriptionSchema = z.object({
  subscription: pushSubscriptionSchema,
  userId: z.string().optional(),
  contractIds: z.array(z.number()).optional(), // Contracts user wants to receive alerts for
});

export const testPushNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  subscriptionId: z.string().optional(), // If not provided, sends to all subscriptions
});

// Response schemas
export const pushSubscriptionResponseSchema = createResponseSchema(
  z.object({
    id: z.string(),
    subscription: pushSubscriptionSchema,
    userId: z.string().nullable(),
    contractIds: z.array(z.number()),
    createdAt: z.string(),
  }),
);

export const vapidPublicKeyResponseSchema = createResponseSchema(
  z.object({
    publicKey: z.string(),
  }),
);

// Types
export type PushSubscriptionData = z.infer<typeof pushSubscriptionSchema>;
export type CreatePushSubscription = z.infer<
  typeof createPushSubscriptionSchema
>;
export type TestPushNotification = z.infer<typeof testPushNotificationSchema>;
