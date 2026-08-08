import { Router } from 'express';
import * as adminReviewController from '../controllers/adminReviewController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', adminReviewController.listReviews);
router.patch('/:id/visibility', adminReviewController.setVisibility);

export default router;
