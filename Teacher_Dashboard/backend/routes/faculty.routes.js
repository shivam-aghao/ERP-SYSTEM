import { Router } from 'express';
import {
  getAllFaculty,
  getFacultyById,
  getFacultyByEmployeeId,
  updateFaculty,
} from '../controllers/faculty.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyAuth, getAllFaculty);
router.get('/:id', verifyAuth, getFacultyById);
router.get('/employee/:employeeId', verifyAuth, getFacultyByEmployeeId);
router.put('/:id', verifyAuth, updateFaculty);

export default router;
