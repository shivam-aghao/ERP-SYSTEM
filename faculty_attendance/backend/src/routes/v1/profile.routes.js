import { Router } from 'express';
import { ProfileController } from '../../controllers/profile.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { updateProfileSchema } from '../../validators/profile.validator.js';

const router = Router();

router.use(authenticate);

router.get('/profile', ProfileController.getProfile);
router.put('/profile', validate(updateProfileSchema), ProfileController.updateProfile);
router.get('/notifications', ProfileController.getNotifications);
router.patch('/notifications/:id/read', ProfileController.markNotificationRead);

export default router;
