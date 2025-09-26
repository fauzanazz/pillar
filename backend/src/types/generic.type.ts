import z from 'zod';

export const genericSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  code: z.number().default(200),
});

export const idParamsSchema = z.object({
  id: z.string(),
});
export type IdParams = z.infer<typeof idParamsSchema>;

export const userIdParamsSchema = z.object({
  userId: z.string(),
});
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
