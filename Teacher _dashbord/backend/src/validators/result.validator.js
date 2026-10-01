import { z } from 'zod';

export const createResultValidator = z.object({
  body: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    subjectCode: z.string().min(1, 'Subject code is required'),
    assessmentType: z.enum(['IA1', 'IA2', 'MSE', 'ESE', 'PRACTICAL']),
    marksObtained: z.number().min(0, 'Marks obtained cannot be negative'),
    maxMarks: z.number().min(1, 'Max marks must be greater than zero'),
    academicYear: z.string().min(1, 'Academic year is required'),
    semester: z.string().optional(),
  }),
});

export const bulkUploadResultsValidator = z.object({
  body: z.object({
    subjectCode: z.string().min(1, 'Subject code is required'),
    assessmentType: z.enum(['IA1', 'IA2', 'MSE', 'ESE', 'PRACTICAL']),
    academicYear: z.string().min(1, 'Academic year is required'),
    semester: z.string().optional(),
    results: z.array(
      z.object({
        studentId: z.string().uuid(),
        marksObtained: z.number().min(0),
        maxMarks: z.number().min(1),
      })
    ).min(1, 'At least one student result must be provided'),
  }),
});

export const getResultsQueryValidator = z.object({
  query: z.object({
    subjectCode: z.string().optional(),
    studentId: z.string().uuid().optional(),
    assessmentType: z.string().optional(),
    academicYear: z.string().optional(),
  }).partial(),
});

