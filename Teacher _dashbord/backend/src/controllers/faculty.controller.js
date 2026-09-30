import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { facultyService } from '../services/faculty.service.js';

export const getAllFaculty = asyncHandler(async (req, res) => {
  const faculty = await facultyService.getAllFaculty(req.query);
  return res.status(200).json(new ApiResponse(200, faculty, 'Faculty list retrieved successfully'));
});

export const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await facultyService.getFacultyById(req.params.id);
  return res.status(200).json(new ApiResponse(200, faculty, 'Faculty details retrieved'));
});

export const getFacultyByEmployeeId = asyncHandler(async (req, res) => {
  const faculty = await facultyService.getFacultyByEmployeeId(req.params.employeeId);
  return res.status(200).json(new ApiResponse(200, faculty, 'Faculty retrieved by employee ID'));
});

export const updateFaculty = asyncHandler(async (req, res) => {
  const updated = await facultyService.updateFaculty(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, updated, 'Faculty updated successfully'));
});

export default {
  getAllFaculty,
  getFacultyById,
  getFacultyByEmployeeId,
  updateFaculty,
};

