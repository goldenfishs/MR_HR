import { Router } from 'express';
import RegistrationController from '../controllers/registration.controller';
import { authenticate, requireAdmin, requireInterviewer } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';
import { registrationLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Protected routes (require authentication)
router.get('/', authenticate, requireInterviewer, RegistrationController.getAllRegistrations);
router.get('/my', authenticate, RegistrationController.getMyRegistrations);
router.get('/:id', authenticate, RegistrationController.getRegistrationById);
router.post(
  '/',
  authenticate,
  registrationLimiter,
  validate(schemas.createRegistration),
  RegistrationController.createRegistration
);
router.put('/:id/cancel', authenticate, RegistrationController.cancelRegistration);
router.put(
  '/:id/status',
  authenticate,
  requireInterviewer,
  validate(schemas.updateRegistrationStatus),
  RegistrationController.updateRegistrationStatus
);
router.put(
  '/:id/score',
  authenticate,
  requireInterviewer,
  validate(schemas.scoreRegistration),
  RegistrationController.scoreRegistration
);
router.post('/:id/announce', authenticate, requireAdmin, RegistrationController.announceResult);

export default router;
