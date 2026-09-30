import { z } from 'zod';

export const createCardSchema = z.object({
  body: z.object({
    department: z.string().min(1, 'Department is required'),
    classId: z.string().min(1, 'Class is required'),
    subject: z.string().min(1, 'Subject is required'),
    teacherId: z.string().optional(),
  }),
});

export const updateCardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
  body: z.object({
    department: z.string().optional(),
    classId: z.string().optional(),
    subject: z.string().optional(),
  }),
});

export const deleteCardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
});
