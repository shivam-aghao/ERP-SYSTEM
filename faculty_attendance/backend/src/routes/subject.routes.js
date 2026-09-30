import { Router } from 'express';
import { getSubjects } from '../controllers/subject.controller.js';

const router = Router();

router.get('/', getSubjects);

export default router;
