import { Router } from 'express';
import {
  checkDuplicate,
  saveDraft,
  submitAttendance,
  getAllRecords,
  getSessionDetails
} from '../controllers/attendance.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitAttendanceSchema } from '../validators/attendance.validator.js';

const router = Router();

router.use(verifyJWT);
router.get('/check-duplicate', checkDuplicate);
router.post('/draft', validate(submitAttendanceSchema), saveDraft);
router.post('/submit', validate(submitAttendanceSchema), submitAttendance);
router.get('/records', getAllRecords);
router.get('/sessions/:id', getSessionDetails);

export default router;
