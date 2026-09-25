import { z } from 'zod';

const recordItemSchema = z.object({
  studentId: z.string().optional(),
  rollNo: z.number().or(z.string()).optional(),
  name: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'UNMARKED', 'present', 'absent', 'unmarked']).transform(s => s.toUpperCase()),
});

export const attendanceSessionPayloadSchema = z.object({
  department: z.string().optional(),
  classId: z.string().min(1, 'Class identifier is required'),
  subjectCode: z.string().optional(),
  subjectName: z.string().optional(),
  subjectId: z.string().optional(),
  subject: z.string().optional(),
  date: z.string().min(1, 'Session date is required'),
  period: z.union([z.number(), z.string()]).transform(val => parseInt(val, 10)).optional(),
  periodNo: z.union([z.number(), z.string()]).transform(val => parseInt(val, 10)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  sessionType: z.enum(['REGULAR', 'EXTRA', 'PRACTICAL', 'regular', 'extra', 'practical']).optional().transform(s => s ? s.toUpperCase() : 'REGULAR'),
  topic: z.string().optional(),
  topicTaught: z.string().optional(),
  additionalTopics: z.string().optional(),
  remark: z.string().optional(),
  records: z.array(recordItemSchema).optional().default([]),
  totalStudents: z.number().optional(),
  presentCount: z.number().optional(),
  absentCount: z.number().optional(),
  attendanceRate: z.number().optional(),
});

export const saveDraftSchema = z.object({
  body: attendanceSessionPayloadSchema,
});

export const submitAttendanceSchema = z.object({
  body: attendanceSessionPayloadSchema.refine((data) => (data.records && data.records.length > 0), {
    message: 'Attendance submission requires at least one student attendance record',
    path: ['records'],
  }),
});

export const checkDuplicateSchema = z.object({
  query: z.object({
    department: z.string().optional(),
    classId: z.string().min(1, 'Class is required'),
    date: z.string().min(1, 'Date is required'),
    subjectCode: z.string().min(1, 'Subject code is required'),
    period: z.union([z.number(), z.string()]).optional(),
  }),
});
