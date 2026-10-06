import { Router } from 'express';
import teacherController from '../controllers/teacherController.js';

const router = Router();

// /api/teacher/profile
router.get('/profile', teacherController.getProfile);

// /api/teacher/summary (Live KPIs & timetable for dashboard)
router.get('/summary', teacherController.getDashboardSummary);

// /api/teacher/schedule & /api/teacher/timetable
router.get('/schedule', teacherController.getSchedule);
router.get('/timetable', teacherController.getSchedule);

// /api/teacher/classes
router.get('/classes', teacherController.getClasses);

// /api/teacher/attendance
router.get('/attendance', teacherController.getAttendanceSessions);
router.get('/attendance/sessions', teacherController.getAttendanceSessions);
router.post('/attendance', teacherController.submitAttendance);
router.post('/attendance/submit', teacherController.submitAttendance);

// Dual-Method Attendance (Swipe Card & Roster List) endpoints:
// GET /api/teacher/class-roster?classId=...
router.get('/class-roster', teacherController.getClassRoster);

// POST /api/teacher/attendance/swipe (Instant card reader lookup & mark)
router.post('/attendance/swipe', teacherController.swipeAttendance);

// POST /api/teacher/attendance/bulk (Final submission with all student statuses)
router.post('/attendance/bulk', teacherController.bulkAttendance);

// /api/teacher/students
router.get('/students', teacherController.getStudents);

// /api/teacher/notifications
router.get('/notifications', teacherController.getNotifications);

// Root fallback /api/teacher
router.get('/', teacherController.getProfile);

export default router;
