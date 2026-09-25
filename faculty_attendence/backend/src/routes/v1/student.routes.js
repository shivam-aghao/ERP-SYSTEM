import { Router } from 'express';
import { StudentController } from '../../controllers/student.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/class/:classId', StudentController.getRoster);

export default router;
