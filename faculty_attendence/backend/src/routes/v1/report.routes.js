import { Router } from 'express';
import { ReportController } from '../../controllers/report.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/classes/:classId/stats', ReportController.getClassStats);
router.get('/sessions/:sessionId/csv', ReportController.exportCsv);

export default router;
