import { Router } from 'express';
import { getAllSubjects, getSubjectByCode } from '../controllers/subject.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyAuth, getAllSubjects);
router.get('/:code', verifyAuth, getSubjectByCode);

export default router;
