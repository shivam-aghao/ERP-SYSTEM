import { z } from 'zod';

export const uuidParam = (paramName = 'id') =>
  z.object({
    params: z.object({
      [paramName]: z.string().uuid(`Invalid ${paramName} UUID format`),
    }),
  });

export const paginationQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  }).partial(),
});

export const classSubjectFilterQuery = z.object({
  query: z.object({
    classCode: z.string().optional(),
    subjectCode: z.string().optional(),
    departmentCode: z.string().optional(),
    academicYear: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }).partial(),
});

