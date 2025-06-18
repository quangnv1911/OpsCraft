import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email cannot be empty' })
    .email({ message: 'Email is not valid' })
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, { message: 'Password cannot be empty' })
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password cannot be more than 100 characters' }),
  isRememberMe: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>
