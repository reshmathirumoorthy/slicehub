import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { protectUser } from '../middleware/auth.js';

const router = Router();

router.use(protectUser);

router.get('/', notificationController.listMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.remove);

export default router;
