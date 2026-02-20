import { Router } from 'express';
import QuestionController from '../controllers/question.controller';
import { authenticate, requireInterviewer } from '../middlewares/auth.middleware';
import { validate, schemas } from '../middlewares/validation.middleware';

const router = Router();

// Public routes
router.get('/', QuestionController.getAllQuestions);
router.get('/categories', QuestionController.getCategories);
router.get('/random', QuestionController.getRandomQuestions);
router.get('/:id', QuestionController.getQuestionById);

// Admin/Interviewer routes
router.post(
  '/',
  authenticate,
  requireInterviewer,
  validate(schemas.createQuestion),
  QuestionController.createQuestion
);
router.put(
  '/:id',
  authenticate,
  requireInterviewer,
  validate(schemas.updateQuestion),
  QuestionController.updateQuestion
);
router.delete(
  '/:id',
  authenticate,
  requireInterviewer,
  QuestionController.deleteQuestion
);

export default router;
