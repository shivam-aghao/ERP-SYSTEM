import { Router } from 'express';
import authRoutes from './auth.routes.js';
import teacherRoutes from './teacher.routes.js';
import departmentRoutes from './department.routes.js';
import classRoutes from './class.routes.js';
import subjectRoutes from './subject.routes.js';
import classCardRoutes from './classCard.routes.js';
import attendanceRoutes from './attendance.routes.js';
import studentRoutes from './student.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/cards', classCardRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/students', studentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
