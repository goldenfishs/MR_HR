import { Router } from 'express';
import AdminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.get('/', authenticate, requireAdmin, AdminController.getDashboard);
router.get('/dashboard', authenticate, requireAdmin, AdminController.getDashboard);
router.get('/statistics', authenticate, requireAdmin, AdminController.getStatistics);

// User management
router.get('/users', authenticate, requireAdmin, AdminController.getAllUsers);
router.put('/users/:id/role', authenticate, requireAdmin, AdminController.updateUserRole);
router.delete('/users/:id', authenticate, requireAdmin, AdminController.deleteUser);

// Slot management
router.post(
  '/interviews/:interview_id/slots',
  authenticate,
  requireAdmin,
  validate(schemas.createSlot),
  AdminController.createSlot
);
router.put(
  '/slots/:id',
  authenticate,
  requireAdmin,
  validate(schemas.updateSlot),
  AdminController.updateSlot
);
router.delete('/slots/:id', authenticate, requireAdmin, AdminController.deleteSlot);

export default router;
