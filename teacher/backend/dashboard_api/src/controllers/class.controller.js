import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { classService } from '../services/class.service.js';

export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getAllClasses(req.query.departmentCode);
  return res.status(200).json(new ApiResponse(200, classes, 'Classes retrieved successfully'));
});

export const getClassByCode = asyncHandler(async (req, res) => {
  const cls = await classService.getClassByCode(req.params.code);
  return res.status(200).json(new ApiResponse(200, cls, 'Class details retrieved'));
});

export default {
  getAllClasses,
  getClassByCode,
};

