import { Router } from 'express';
import {
  getMyTimetable,
  getClassTimetable,
  syncTimetable,
} from '../controllers/timetable.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyAuth);

router.get('/my', getMyTimetable);
router.get('/class/:classCode', getClassTimetable);
router.post('/sync', syncTimetable);

export default router;
