import { Router } from 'express';
import { getClasses } from '../controllers/class.controller.js';

const router = Router();

router.get('/', getClasses);

export default router;
