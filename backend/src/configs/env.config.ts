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
  // S3/MinIO Configuration
  S3_BUCKET_NAME: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string().default('us-east-1'),

  // AI Service Configuration
  AI_SERVICE_URL: z.string().default('http://localhost:8081'),

  // RabbitMQ Configuration
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),

  // Worker Configuration (from PRD)
  MAX_RETRIES_SINGLE: z.coerce.number().default(7),
  MAX_RETRIES_BATCH: z.coerce.number().default(5),
  RETRY_BACKOFF_MAX_SEC: z.coerce.number().default(300),
  WORKER_METRICS_PORT: z.coerce.number().default(9108),

  // Web Push Configuration
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid environment variables: ');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
