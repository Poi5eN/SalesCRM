import { z } from 'zod';
import 'dotenv/config';
const envSchema = z.object({
    PORT: z.string().transform(Number).default(4000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_URL: z.string().url(),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    const errors = parsedEnv.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:');
    Object.entries(errors).forEach(([field, messages]) => {
        console.error(`  - ${field}: ${messages?.join(', ')}`);
    });
    throw new Error('Invalid environment variables');
}
export const env = parsedEnv.data;
