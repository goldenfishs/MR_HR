import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';
import { authLimiter, emailLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(schemas.register), AuthController.register);
router.post('/login', authLimiter, validate(schemas.login), AuthController.login);
router.post('/send-verification', emailLimiter, validate(schemas.sendVerification), AuthController.sendVerification);
router.post('/reset-password', validate(schemas.resetPassword), AuthController.resetPassword);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.post('/change-password', authenticate, validate(schemas.changePassword), AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
