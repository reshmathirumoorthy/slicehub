import { Router } from 'express';
import * as adminNotificationController from '../controllers/adminNotificationController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', adminNotificationController.listNotifications);
router.get('/unread-count', adminNotificationController.getUnreadCount);
router.patch('/read-all', adminNotificationController.markAllRead);
router.patch('/:id/read', adminNotificationController.markRead);
router.delete('/:id', adminNotificationController.remove);

export default router;
