import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/db.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    orderBy: { code: 'asc' }
  });
  return res.status(200).json(new ApiResponse(200, departments, 'Departments retrieved'));
});
