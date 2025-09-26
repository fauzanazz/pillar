import z from 'zod';

import { createResponseSchema } from '@/lib/response-factory';

import { sessionSchema, sessionUserSchema } from './session.type';

export const healthSchema = createResponseSchema(
  z.object({
    status: z.string().default('ok'),
    timestamp: z.string().datetime(),
  }),
);

export const protectedHealthSchema = createResponseSchema(
  z.object({
    status: z.string().default('ok'),
    user: sessionUserSchema.optional(),
    session: sessionSchema.optional(),
    timestamp: z.string().datetime(),
  }),
);
