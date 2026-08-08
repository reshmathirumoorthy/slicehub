import { Router } from 'express';
import * as adminDashboardController from '../controllers/adminDashboardController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/overview', adminDashboardController.getOverview);
router.get('/analytics', adminDashboardController.getAnalytics);

export default router;
