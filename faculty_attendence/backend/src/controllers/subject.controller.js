import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/db.js';

export const getSubjects = asyncHandler(async (req, res) => {
  const { department, departmentCode } = req.query;
  const dept = departmentCode || department;

  const where = dept ? { departmentCode: dept } : {};

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { code: 'asc' }
  });

  return res.status(200).json(new ApiResponse(200, subjects, 'Subjects retrieved'));
});
