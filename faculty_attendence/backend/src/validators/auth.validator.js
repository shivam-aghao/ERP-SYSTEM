import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    employeeCode: z.string().min(1, 'Employee code is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(1, 'Password is required').optional()
  }).refine((data) => data.employeeCode || data.email, {
    message: 'Either employeeCode or email must be provided'
  })
});
