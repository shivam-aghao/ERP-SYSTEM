import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/db.js';
import { serializeTeacher } from '../serializers/teacher.serializer.js';

export const getTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: req.teacher.id },
    include: { department: true }
  });
  return res.status(200).json(new ApiResponse(200, serializeTeacher(teacher), 'Teacher profile retrieved'));
});
