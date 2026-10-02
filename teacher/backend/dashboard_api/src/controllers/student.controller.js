import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { studentService } from '../services/student.service.js';

export const getStudents = asyncHandler(async (req, res) => {
  const result = await studentService.getStudents(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Students retrieved successfully'));
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  return res.status(200).json(new ApiResponse(200, student, 'Student details retrieved'));
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  return res.status(201).json(new ApiResponse(201, student, 'Student created successfully'));
});

export const updateStudent = asyncHandler(async (req, res) => {
  const updated = await studentService.updateStudent(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, updated, 'Student updated successfully'));
});

export default {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
};
