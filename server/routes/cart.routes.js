import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import { optionalUser, protectUser } from '../middleware/auth.js';

const router = Router();

router.use(optionalUser);

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);

router.post('/coupon', cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);
router.post('/merge', protectUser, cartController.mergeCart);
router.post('/clear', cartController.clearCart);
router.delete('/', cartController.clearCart);

router.patch('/:itemId', cartController.updateItem);
router.delete('/:itemId', cartController.removeItem);

export default router;
