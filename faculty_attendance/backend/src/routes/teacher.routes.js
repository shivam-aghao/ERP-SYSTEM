import { Router } from 'express';
import { getTeacherProfile } from '../controllers/teacher.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.get('/profile', getTeacherProfile);

export default router;
