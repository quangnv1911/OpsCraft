import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
});

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
    user_name: z.string().min(1, 'User name is required'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
});
export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const LogoutSchema = z.object({
    refreshToken: z.string().optional(),
});

export const LoginGoogleSchema = z.object({
    code: z.string().min(1, 'Google oauth code is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
