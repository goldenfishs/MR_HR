import { Router } from 'express';
import InterviewController from '../controllers/interview.controller';
import { authenticate, requireAdmin, requireInterviewer } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// Public routes (for viewing published interviews)
router.get('/', InterviewController.getAllInterviews);
router.get('/:id', InterviewController.getInterviewById);
router.get('/:id/slots', InterviewController.getInterviewSlots);
router.get('/:id/available-slots', InterviewController.getAvailableSlots);

// Protected routes (require authentication)
router.get('/:id/registrations', authenticate, requireInterviewer, InterviewController.getInterviewRegistrations);

// Admin/Interviewer routes
router.post(
  '/',
  authenticate,
  requireInterviewer,
  validate(schemas.createInterview),
  InterviewController.createInterview
);
router.put(
  '/:id',
  authenticate,
  requireInterviewer,
  validate(schemas.updateInterview),
  InterviewController.updateInterview
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  InterviewController.deleteInterview
);
router.post(
  '/:id/publish',
  authenticate,
  requireInterviewer,
  InterviewController.publishInterview
);
router.post(
  '/:id/close',
  authenticate,
  requireInterviewer,
  InterviewController.closeInterview
);

export default router;
