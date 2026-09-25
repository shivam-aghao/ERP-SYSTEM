import { Router } from 'express';
import { MasterDataController } from '../../controllers/masterData.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/departments', MasterDataController.getDepartments);
router.get('/classes', MasterDataController.getClasses);
router.get('/subjects', MasterDataController.getSubjects);

export default router;
