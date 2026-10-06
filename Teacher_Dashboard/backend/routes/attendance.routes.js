import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  markRecord,
  submitSession,
} from '../controllers/attendance.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createSessionValidator,
  markAttendanceRecordValidator,
  submitAttendanceValidator,
  attendanceQueryValidator,
} from '../validators/attendance.validator.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyAuth);

router.post('/sessions', validate(createSessionValidator), createSession);
router.get('/sessions', validate(attendanceQueryValidator), getSessions);
router.get('/sessions/:id', getSessionById);
router.post('/sessions/:sessionId/mark', validate(markAttendanceRecordValidator), markRecord);
router.post('/sessions/:sessionId/submit', validate(submitAttendanceValidator), submitSession);

export default router;

