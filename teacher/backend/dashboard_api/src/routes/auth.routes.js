import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginValidator, registerValidator, updateProfileValidator } from '../validators/auth.validator.js';
import { verifyAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validate(loginValidator), login);
router.post('/register', validate(registerValidator), register);
router.get('/profile', verifyAuth, getProfile);
router.put('/profile', verifyAuth, validate(updateProfileValidator), updateProfile);

export default router;

