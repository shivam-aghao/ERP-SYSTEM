import { z } from 'zod';

export const createStudentValidator = z.object({
  body: z.object({
    rollNo: z.number().int().min(1),
    rollFormatted: z.string().optional(),
    enrollmentNo: z.string().min(3),
    name: z.string().min(2),
    email: z.string().email().optional(),
    classCode: z.string().min(1),
    departmentCode: z.string().min(1),
    phone: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
  }),
});

export const updateStudentValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid student ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    rollNo: z.number().int().optional(),
    rollFormatted: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getStudentsQueryValidator = z.object({
  query: z.object({
    classCode: z.string().optional(),
    departmentCode: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  }).partial(),
});

