import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';

import { user, userRoleEnum } from '@/db/schema';

// Role enum for validation
export const userRoleSchema = z.enum(userRoleEnum.enumValues);

// Create
export const createUserSchema = createInsertSchema(user).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Read
export const readUserSchema = createSelectSchema(user, {
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export const readUserListSchema = z.array(readUserSchema);

// Update
export const updateUserSchema = createUserSchema.partial();

// Types
export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type ReadUser = z.infer<typeof readUserSchema>;
export type ReadUserList = z.infer<typeof readUserListSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
