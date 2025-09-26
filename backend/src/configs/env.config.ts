import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .string()
    .default('development')
    .transform((value) => value.toLowerCase()),
  DATABASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z
    .string()
    .default('["http://localhost:3000"]')
    .transform((value) => JSON.parse(value))
    .pipe(z.array(z.string().url())),
  TRUSTED_ORIGINS: z
    .string()
    .default('["http://localhost:3000"]')
    .transform((value) => JSON.parse(value))
    .pipe(z.array(z.string().url())),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_ENDPOINT: z.string(),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid environment variables: ');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
