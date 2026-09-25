import { Router } from 'express';
import { CardController } from '../../controllers/card.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createCardSchema, updateCardSchema, deleteCardSchema } from '../../validators/card.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', CardController.getCards);
router.post('/', validate(createCardSchema), CardController.createCard);
router.get('/check-duplicate', CardController.checkDuplicate);
router.put('/:id', validate(updateCardSchema), CardController.updateCard);
router.delete('/:id', validate(deleteCardSchema), CardController.deleteCard);

export default router;
