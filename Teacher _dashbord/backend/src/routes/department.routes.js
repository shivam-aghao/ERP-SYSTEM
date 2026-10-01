import { Router } from 'express';
import { getAllDepartments, getDepartmentByCode } from '../controllers/department.controller.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyAuth, getAllDepartments);
router.get('/:code', verifyAuth, getDepartmentByCode);

export default router;
