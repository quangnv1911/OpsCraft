import { z } from 'zod';

// Define schema for environment variables
export const envSchema = z.object({
    PORT: z.string().min(1, '❌ PORT is required').default('8000'),
    FRONTEND_URL: z.string().min(1, '❌ FRONTEND_URL is required'),
    BACKEND_URL: z.string().min(1, '❌ BACKEND_URL is required'),
    NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
    JWT_ACCESS_SECRET: z.string().min(1, '❌ JWT_ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: z.string().min(1, '❌ JWT_REFRESH_SECRET is required'),
    JWT_ACCESS_EXPIRES_IN: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
            message: '❌ JWT_ACCESS_EXPIRES_IN is required and must be a number > 0',
        }),

    JWT_REFRESH_EXPIRES_IN: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
            message: '❌ JWT_REFRESH_EXPIRES_IN is required and must be a number > 0',
        }),

    JWT_REFRESH_EXPIRES_IN_REMEMBER: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
            message: '❌ JWT_REFRESH_EXPIRES_IN_REMEMBER is required and must be a number > 0',
        }),
    GOOGLE_CLIENT_ID: z.string().min(1, '❌ GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, '❌ GOOGLE_CLIENT_SECRET is required'),
});

// Optional: infer TypeScript type from schema
export type EnvSchema = z.infer<typeof envSchema>;
