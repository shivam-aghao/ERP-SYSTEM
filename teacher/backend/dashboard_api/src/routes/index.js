import { Router } from 'express';
import authRoutes from './auth.routes.js';
import facultyRoutes from './faculty.routes.js';
import departmentRoutes from './department.routes.js';
import classRoutes from './class.routes.js';
import subjectRoutes from './subject.routes.js';
import studentRoutes from './student.routes.js';
import attendanceRoutes from './attendance.routes.js';
import timetableRoutes from './timetable.routes.js';
import syllabusRoutes from './syllabus.routes.js';
import resultRoutes from './result.routes.js';
import notificationRoutes from './notification.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/faculty', facultyRoutes);
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetable', timetableRoutes);
router.use('/syllabus', syllabusRoutes);
router.use('/results', resultRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
