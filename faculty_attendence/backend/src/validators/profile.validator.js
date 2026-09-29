import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    avatarInitials: z.string().max(4).optional(),
  }),
});
