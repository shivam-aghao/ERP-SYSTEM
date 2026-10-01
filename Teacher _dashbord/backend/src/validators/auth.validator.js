import { z } from 'zod';

export const loginValidator = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const registerValidator = z.object({
  body: z.object({
    employeeId: z.string().min(2, 'Employee ID is required'),
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    departmentCode: z.string().min(2, 'Department code is required'),
    title: z.string().optional(),
    prefix: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const updateProfileValidator = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    title: z.string().optional(),
    prefix: z.string().optional(),
    phone: z.string().optional(),
    cabinLocation: z.string().optional(),
    officeHours: z.string().optional(),
    qualification: z.string().optional(),
  }),
});

