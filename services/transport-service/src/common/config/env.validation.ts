import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TRANSPORT_SERVICE_PORT: z.coerce.number().int().positive().default(4100),
  DATABASE_URL: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  INTERNAL_SERVICE_KEY: z.string().default('dev_internal_service_key_change_me'),
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
