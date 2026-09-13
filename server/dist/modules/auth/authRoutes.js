import { Router } from 'express';
import { AuthController } from './authController.js';
import { authenticate } from '../../middleware/auth.js';
const router = Router();
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.me);
export const authRoutes = router;
