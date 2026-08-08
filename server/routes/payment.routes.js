import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protectUser } from '../middleware/auth.js';

const router = Router();

/** Public key only — secret never leaves the server */
router.get('/config', paymentController.getConfig);

router.use(protectUser);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/fail', paymentController.markFailed);

export default router;
