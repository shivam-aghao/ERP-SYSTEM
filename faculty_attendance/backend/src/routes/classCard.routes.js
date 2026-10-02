import { Router } from 'express';
import { getTeacherCards, createCard, deleteCard } from '../controllers/classCard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createClassCardSchema } from '../validators/classCard.validator.js';

const router = Router();

router.use(verifyJWT);
router.get('/', getTeacherCards);
router.post('/', validate(createClassCardSchema), createCard);
router.delete('/:id', deleteCard);

export default router;
