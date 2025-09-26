import { z } from 'zod';

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.string().nullable().optional(),
});

export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  token: z.string(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
