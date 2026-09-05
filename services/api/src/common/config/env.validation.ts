import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default('near-by-api'),

  S3_ENDPOINT: z.string().min(1),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_MEDIA: z.string().min(1),
  S3_BUCKET_VERIFICATION: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_REFRESH_TTL: z.string().default('7d'),

  PAYMENT_PROVIDER: z.enum(['mock', 'razorpay']).default('mock'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  EMAIL_PROVIDER: z.string().default('console'),
  SMS_PROVIDER: z.string().default('console'),

  TRANSPORT_SERVICE_URL: z.string().default('http://localhost:4100'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration — ${message}`);
  }
  return parsed.data;
}
