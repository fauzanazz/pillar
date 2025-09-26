import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

import { alerts } from '@/db/schema';
import { createResponseSchema } from '@/lib/response-factory';

// Alert priority enum
export const alertPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type AlertPriorityEnum = z.infer<typeof alertPriorityEnum>;

// Base alert schema
export const alertSchema = createSelectSchema(alerts, {
  priority: alertPriorityEnum,
  createdAt: z.union([z.string(), z.date()]),
}).openapi('Alert');

// Alert with contract details
export const alertWithContractSchema = alertSchema
  .extend({
    contract: z
      .object({
        id: z.number(),
        title: z.string(),
        status: z.string(),
      })
      .optional(),
  })
  .openapi('AlertWithContract');

// Request schemas
export const getAlertsQuerySchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  priority: alertPriorityEnum.optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  contractId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const markAlertAsReadSchema = z.object({
  isRead: z.boolean(),
});

// Response schemas
export const alertResponseSchema = createResponseSchema(alertSchema);
export const alertWithContractResponseSchema = createResponseSchema(
  alertWithContractSchema,
);
export const alertsListResponseSchema = createResponseSchema(
  z.object({
    alerts: z.array(alertWithContractSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
);

// Types
export type Alert = z.infer<typeof alertSchema>;
export type AlertWithContract = z.infer<typeof alertWithContractSchema>;
export type GetAlertsQuery = z.infer<typeof getAlertsQuerySchema>;
export type MarkAlertAsRead = z.infer<typeof markAlertAsReadSchema>;
