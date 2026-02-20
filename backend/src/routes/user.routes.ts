import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// All user routes require authentication
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, validate(schemas.updateProfile), UserController.updateProfile);
router.post('/avatar', authenticate, UserController.uploadAvatar);
router.get('/interviews', authenticate, UserController.getMyInterviews);

export default router;
