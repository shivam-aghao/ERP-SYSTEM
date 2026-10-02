import { Router } from 'express';
import {
  getSyllabusProgress,
  updateUnitProgress,
} from '../controllers/syllabus.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyAuth);

router.get('/:subjectCode/:classCode', getSyllabusProgress);
router.put('/:subjectCode/:classCode/unit/:unitNumber', updateUnitProgress);

export default router;
