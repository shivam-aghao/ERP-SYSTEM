import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { timetableService } from '../services/timetable.service.js';

export const getMyTimetable = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const timetable = await timetableService.getFacultyTimetable(facultyId, req.query.academicYear);
  return res.status(200).json(new ApiResponse(200, timetable, 'Timetable retrieved successfully'));
});

export const getClassTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.getClassTimetable(req.params.classCode, req.query.academicYear);
  return res.status(200).json(new ApiResponse(200, timetable, 'Class timetable retrieved successfully'));
});

export const syncTimetable = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const result = await timetableService.syncTimetable(req.body.entries, facultyId);
  return res.status(200).json(new ApiResponse(200, result, 'Timetable synced successfully'));
});

export default {
  getMyTimetable,
  getClassTimetable,
  syncTimetable,
};

