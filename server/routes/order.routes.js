import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { protectUser } from '../middleware/auth.js';

const router = Router();

router.use(protectUser);

router.post('/', orderController.createOrder);
router.get('/my', orderController.listMyOrders);
router.get('/:id/tracking', orderController.getMyOrderTracking);
router.get('/:id', orderController.getMyOrder);
router.patch('/:id/cancel', orderController.cancelMyOrder);

export default router;
