import { z } from 'zod';

export const createClassCardSchema = z.object({
  body: z.object({
    department: z.string().min(1, 'Department code is required').optional(),
    departmentCode: z.string().min(1, 'Department code is required').optional(),
    classId: z.string().min(1, 'Class code is required').optional(),
    classCode: z.string().min(1, 'Class code is required').optional(),
    subjectCode: z.string().min(1, 'Subject code is required')
  })
});
