import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { subjectService } from '../services/subject.service.js';

export const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getAllSubjects({
    classCode: req.query.classCode,
    facultyId: req.query.facultyId || req.user?.id,
  });
  return res.status(200).json(new ApiResponse(200, subjects, 'Subjects retrieved successfully'));
});

export const getSubjectByCode = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubjectByCode(req.params.code);
  return res.status(200).json(new ApiResponse(200, subject, 'Subject details retrieved'));
});

export default {
  getAllSubjects,
  getSubjectByCode,
};
