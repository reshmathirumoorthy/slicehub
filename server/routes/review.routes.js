import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { optionalUser, protectUser } from '../middleware/auth.js';

const router = Router();

router.get(
  '/pizza/:pizzaId',
  optionalUser,
  reviewController.listPizzaReviews,
);

router.get(
  '/pizza/:pizzaId/eligibility',
  protectUser,
  reviewController.getEligibility,
);

router.post('/', protectUser, reviewController.createReview);
router.patch('/:id', protectUser, reviewController.updateReview);
router.delete('/:id', protectUser, reviewController.deleteReview);

export default router;
