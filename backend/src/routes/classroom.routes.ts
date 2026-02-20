import { Router } from 'express';
import ClassroomController from '../controllers/classroom.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// Public routes (for viewing classrooms)
router.get('/', ClassroomController.getAllClassrooms);
router.get('/available', ClassroomController.getAvailableClassrooms);
router.get('/:id', ClassroomController.getClassroomById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(schemas.createClassroom),
  ClassroomController.createClassroom
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(schemas.updateClassroom),
  ClassroomController.updateClassroom
);
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  ClassroomController.deleteClassroom
);

export default router;
