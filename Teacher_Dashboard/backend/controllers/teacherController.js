import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { dashboardService } from '../services/dashboard.service.js';
import { facultyService } from '../services/faculty.service.js';
import { timetableService } from '../services/timetable.service.js';
import { classService } from '../services/class.service.js';
import { attendanceService } from '../services/attendance.service.js';
import { studentService } from '../services/student.service.js';
import { notificationService } from '../services/notification.service.js';

// Default Dr. Rohan Deshmukh fallback ID
const DEFAULT_FACULTY_ID = 'a0000000-0000-0000-0000-000000000001';

export const getProfile = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const faculty = await facultyService.getFacultyById(facultyId);
  return res.status(200).json(new ApiResponse(200, faculty, 'Teacher profile retrieved successfully'));
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const summary = await dashboardService.getDashboardSummary(facultyId);
  return res.status(200).json(new ApiResponse(200, summary, 'Teacher dashboard summary retrieved successfully'));
});

export const getSchedule = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const schedule = await timetableService.getFacultyTimetable(facultyId);
  return res.status(200).json(new ApiResponse(200, schedule, 'Teacher timetable schedule retrieved'));
});

export const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getAllClasses(req.query);
  return res.status(200).json(new ApiResponse(200, classes, 'Teacher assigned classes retrieved'));
});

export const getAttendanceSessions = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const sessions = await attendanceService.getSessions({ facultyId, ...req.query });
  return res.status(200).json(new ApiResponse(200, sessions, 'Teacher attendance sessions retrieved'));
});

export const submitAttendance = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const payload = { ...req.body, facultyId };
  const session = await attendanceService.createSession(payload, facultyId);
  return res.status(201).json(new ApiResponse(201, session, 'Attendance marked successfully'));
});

export const getStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getStudents(req.query);
  return res.status(200).json(new ApiResponse(200, students, 'Student roster retrieved'));
});

export const getNotifications = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const notifs = await notificationService.getNotifications(facultyId);
  return res.status(200).json(new ApiResponse(200, notifs, 'Teacher notifications retrieved'));
});

export const getClassRoster = asyncHandler(async (req, res) => {
  const classId = req.query.classId || req.query.classCode || '2R1';
  const departmentCode = req.query.departmentCode || 'CSE';
  const result = await studentService.getStudents({ classCode: classId, departmentCode, limit: 100 });
  const students = result.students || [];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        classId,
        className: `SSGMCE - ${departmentCode} Class ${classId}`,
        totalStudents: students.length,
        students,
      },
      'Class roster retrieved successfully'
    )
  );
});

export const swipeAttendance = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const { classId, cardId, date, timeSlot, subject } = req.body;

  if (!cardId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      code: 'MISSING_CARD_ID',
      message: 'Card ID is required for swipe input',
    });
  }

  const result = await attendanceService.verifyAndRecordSwipe({
    classId,
    cardId,
    facultyId,
    subject,
    date,
    timeSlot,
  });

  if (!result.success) {
    const statusCode = result.code === 'NOT_ENROLLED' ? 403 : 404;
    return res.status(statusCode).json({
      success: false,
      statusCode,
      code: result.code,
      message: result.message,
      data: result.student || null,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, result, result.message)
  );
});

export const bulkAttendance = asyncHandler(async (req, res) => {
  const facultyId = req.user?.id || DEFAULT_FACULTY_ID;
  const {
    classId,
    classCode,
    subject,
    subjectCode,
    room,
    date,
    lectureDate,
    timeSlot,
    lectureTime,
    markingMode = 'dual',
    records = [],
  } = req.body;

  const payload = {
    classCode: classCode || classId || '2R1',
    subjectCode: subjectCode || subject || 'Data Structures',
    lectureDate: lectureDate || date || new Date().toISOString().split('T')[0],
    lectureTime: lectureTime || timeSlot || '09:00 - 10:30 AM',
    room: room || 'Room 201',
    markingMode,
    records,
    facultyId,
  };

  const session = await attendanceService.createSession(payload, facultyId);

  return res.status(201).json(
    new ApiResponse(
      201,
      session,
      `Attendance saved successfully for ${payload.subjectCode}`
    )
  );
});

export default {
  getProfile,
  getDashboardSummary,
  getSchedule,
  getClasses,
  getAttendanceSessions,
  submitAttendance,
  getStudents,
  getNotifications,
  getClassRoster,
  swipeAttendance,
  bulkAttendance,
};

