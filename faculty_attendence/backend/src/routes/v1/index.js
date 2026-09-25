import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import masterDataRoutes from './masterData.routes.js';
import cardRoutes from './card.routes.js';
import studentRoutes from './student.routes.js';
import attendanceRoutes from './attendance.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', profileRoutes);
router.use('/master', masterDataRoutes);
router.use('/cards', cardRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);

export default router;
