import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['CUSTOMER', 'PROVIDER']),
    ageConfirmed: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm you are 18 or older' }),
    }),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
