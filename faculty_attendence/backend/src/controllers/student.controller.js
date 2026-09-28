import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { StudentService } from '../services/student.service.js';

export const getClassRoster = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { departmentCode, department } = req.query;

  const dept = departmentCode || department || 'CSE';
  const students = await StudentService.getStudentsByClass(dept, classId);

  return res.status(200).json(new ApiResponse(200, students, 'Class roster retrieved'));
});
