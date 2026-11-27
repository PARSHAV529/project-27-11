import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z
    .string()
    .min(1, 'MONGO_URI is required')
    .refine(
      (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      'MONGO_URI must start with mongodb:// or mongodb+srv://',
    ),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required').default('https://project-27-11-r5fq.vercel.app'),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  SIGNUP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SIGNUP_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(60),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  API_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  );
  process.exit(1);
}

export const env = parsed.data;
