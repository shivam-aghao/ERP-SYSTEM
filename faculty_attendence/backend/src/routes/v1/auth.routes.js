import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema, refreshTokenSchema } from '../../validators/auth.validator.js';
import { authenticate } from '../../middlewares/auth.js';
import { loginRateLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
