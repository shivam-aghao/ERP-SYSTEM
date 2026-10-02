import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/db.js';

export const getClasses = asyncHandler(async (req, res) => {
  const { department, departmentCode } = req.query;
  const dept = departmentCode || department;

  const where = dept ? { departmentCode: dept } : {};

  const classes = await prisma.class.findMany({
    where,
    orderBy: { code: 'asc' }
  });

  return res.status(200).json(new ApiResponse(200, classes, 'Classes retrieved'));
});
