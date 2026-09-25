import { Router } from 'express';
import { AttendanceController } from '../../controllers/attendance.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  saveDraftSchema,
  submitAttendanceSchema,
  checkDuplicateSchema,
} from '../../validators/attendance.validator.js';

const router = Router();

router.use(authenticate);

router.post('/submit', validate(submitAttendanceSchema), AttendanceController.submitAttendance);
router.post('/draft', validate(saveDraftSchema), AttendanceController.saveDraft);
router.get('/draft', AttendanceController.getDraft);
router.get('/check-duplicate', validate(checkDuplicateSchema), AttendanceController.checkDuplicate);
router.get('/records', AttendanceController.getAllRecords);
router.get('/sessions/:id', AttendanceController.getSessionDetails);

export default router;
