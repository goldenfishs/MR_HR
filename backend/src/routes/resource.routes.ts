import { Router } from 'express';
import ResourceController from '../controllers/resource.controller';
import { authenticate, requireInterviewer } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// Public routes
router.get('/', ResourceController.getAllResources);
router.get('/categories', ResourceController.getResourceCategories);
router.get('/:id', ResourceController.getResourceById);

// Admin/Interviewer routes
router.post(
  '/',
  authenticate,
  requireInterviewer,
  validate(schemas.createResource),
  ResourceController.createResource
);
router.put(
  '/:id',
  authenticate,
  requireInterviewer,
  ResourceController.updateResource
);
router.delete(
  '/:id',
  authenticate,
  requireInterviewer,
  ResourceController.deleteResource
);

export default router;
