import { Router } from 'express';
import { getClassRoster } from '../controllers/student.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.get('/class/:classId', getClassRoster);

export default router;
