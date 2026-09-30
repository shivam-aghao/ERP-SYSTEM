import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
} from '../controllers/student.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createStudentValidator,
  updateStudentValidator,
  getStudentsQueryValidator,
} from '../validators/student.validator.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyAuth, validate(getStudentsQueryValidator), getStudents);
router.get('/:id', verifyAuth, getStudentById);
router.post('/', verifyAuth, validate(createStudentValidator), createStudent);
router.put('/:id', verifyAuth, validate(updateStudentValidator), updateStudent);

export default router;
