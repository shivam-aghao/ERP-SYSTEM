import { z } from 'zod';

export const submitAttendanceSchema = z.object({
  body: z.object({
    department: z.string().optional(),
    departmentCode: z.string().optional(),
    classId: z.string().optional(),
    classCode: z.string().optional(),
    subjectCode: z.string(),
    date: z.string(),
    period: z.number().int().optional(),
    timeSlot: z.string().optional(),
    topicTaught: z.string().optional(),
    remark: z.string().optional(),
    students: z.array(
      z.object({
        id: z.string().optional(),
        studentId: z.string().optional(),
        rollNo: z.union([z.string(), z.number()]).optional(),
        status: z.enum(['PRESENT', 'ABSENT', 'Present', 'Absent'])
      })
    ).min(1, 'Students list cannot be empty')
  })
});
