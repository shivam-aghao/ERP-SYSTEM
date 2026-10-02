import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    employeeCode: z.string().trim().optional(),
    email: z.string().email().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => data.employeeCode || data.email, {
    message: 'Either employeeCode or email must be provided',
    path: ['employeeCode'],
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
