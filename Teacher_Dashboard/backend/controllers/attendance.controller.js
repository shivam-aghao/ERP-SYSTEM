import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { attendanceService } from '../services/attendance.service.js';

export const createSession = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const session = await attendanceService.createSession(req.body, facultyId);
  return res.status(201).json(new ApiResponse(201, session, 'Attendance session created'));
});

export const getSessions = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const result = await attendanceService.getSessions({ ...req.query, facultyId });
  return res.status(200).json(new ApiResponse(200, result, 'Attendance sessions retrieved'));
});

export const getSessionById = asyncHandler(async (req, res) => {
  const session = await attendanceService.getSessionById(req.params.id);
  return res.status(200).json(new ApiResponse(200, session, 'Attendance session details retrieved'));
});

export const markRecord = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const record = await attendanceService.markRecord(req.params.sessionId, req.body, facultyId);
  return res.status(200).json(new ApiResponse(200, record, 'Attendance record updated'));
});

export const submitSession = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  const session = await attendanceService.submitSession(req.params.sessionId, req.body, facultyId);
  return res.status(200).json(new ApiResponse(200, session, 'Attendance submitted successfully'));
});

export default {
  createSession,
  getSessions,
  getSessionById,
  markRecord,
  submitSession,
};

