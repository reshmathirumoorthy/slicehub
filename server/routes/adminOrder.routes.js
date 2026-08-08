import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', orderController.listAdminOrders);
router.get('/:id', orderController.getAdminOrder);
router.patch('/:id/status', orderController.updateAdminOrderStatus);

export default router;
