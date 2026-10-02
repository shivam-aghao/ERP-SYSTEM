import { Router } from 'express';
import { getAllClasses, getClassByCode } from '../controllers/class.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyAuth, getAllClasses);
router.get('/:code', verifyAuth, getClassByCode);

export default router;
