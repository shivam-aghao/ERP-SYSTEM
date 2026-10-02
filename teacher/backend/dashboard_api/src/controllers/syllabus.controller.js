import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { syllabusService } from '../services/syllabus.service.js';

export const getSyllabusProgress = asyncHandler(async (req, res) => {
  const { subjectCode, classCode } = req.params;
  const progress = await syllabusService.getSyllabusProgress(subjectCode, classCode);
  return res.status(200).json(new ApiResponse(200, progress, 'Syllabus progress retrieved'));
});

export const updateUnitProgress = asyncHandler(async (req, res) => {
  const { subjectCode, classCode, unitNumber } = req.params;
  const { completionPercent } = req.body;
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';

  const updated = await syllabusService.updateUnitProgress(
    subjectCode,
    classCode,
    unitNumber,
    completionPercent,
    facultyId
  );
  return res.status(200).json(new ApiResponse(200, updated, 'Unit progress updated successfully'));
});

export default {
  getSyllabusProgress,
  updateUnitProgress,
};
