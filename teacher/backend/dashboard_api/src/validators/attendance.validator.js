import { z } from 'zod';

export const createSessionValidator = z.object({
  body: z.object({
    classCode: z.string().min(1, 'Class code is required'),
    subjectCode: z.string().min(1, 'Subject code is required'),
    lectureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Lecture date must be YYYY-MM-DD'),
    lectureTime: z.string().min(1, 'Lecture time is required'),
    markingMode: z.enum(['swipe', 'card', 'bulk']).default('swipe').optional(),
    records: z.array(
      z.object({
        studentId: z.string().uuid(),
        rollNo: z.number().int(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        remarks: z.string().optional(),
      })
    ).optional(),
    isDraft: z.boolean().default(false).optional(),
  }),
});

export const markAttendanceRecordValidator = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    rollNo: z.number().int(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    remarks: z.string().optional(),
  }),
});

export const submitAttendanceValidator = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    records: z.array(
      z.object({
        studentId: z.string().uuid(),
        rollNo: z.number().int(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        remarks: z.string().optional(),
      })
    ).optional(),
  }).optional(),
});

export const attendanceQueryValidator = z.object({
  query: z.object({
    classCode: z.string().optional(),
    subjectCode: z.string().optional(),
    lectureDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }).partial(),
});

