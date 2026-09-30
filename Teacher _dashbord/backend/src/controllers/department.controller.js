import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { departmentService } from '../services/department.service.js';

export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getAllDepartments();
  return res.status(200).json(new ApiResponse(200, departments, 'Departments retrieved successfully'));
});

export const getDepartmentByCode = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentByCode(req.params.code);
  return res.status(200).json(new ApiResponse(200, department, 'Department details retrieved'));
});

export default {
  getAllDepartments,
  getDepartmentByCode,
};

