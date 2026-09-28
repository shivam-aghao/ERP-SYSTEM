import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AttendanceService } from '../services/attendance.service.js';

export const checkDuplicate = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const { department, departmentCode, classId, classCode, subjectCode, date, period } = req.query;

  const result = await AttendanceService.checkDuplicate(
    teacherId,
    departmentCode || department,
    classCode || classId,
    subjectCode,
    date,
    period
  );

  return res.status(200).json(new ApiResponse(200, result, 'Duplicate check completed'));
});

export const saveDraft = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const session = await AttendanceService.submitAttendance(teacherId, req.body, true);
  return res.status(200).json(new ApiResponse(200, session, 'Attendance draft saved successfully'));
});

export const submitAttendance = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const session = await AttendanceService.submitAttendance(teacherId, req.body, false);
  return res.status(201).json(new ApiResponse(201, session, 'Attendance submitted successfully'));
});

export const getAllRecords = asyncHandler(async (req, res) => {
  const teacherId = req.query.teacherId || req.teacher.id;
  const sessions = await AttendanceService.getTeacherSessions(teacherId);
  return res.status(200).json(new ApiResponse(200, sessions, 'Attendance records retrieved'));
});

export const getSessionDetails = asyncHandler(async (req, res) => {
  const teacherId = req.teacher.id;
  const session = await AttendanceService.getSessionDetails(req.params.id, teacherId);
  return res.status(200).json(new ApiResponse(200, session, 'Session details retrieved'));
});
