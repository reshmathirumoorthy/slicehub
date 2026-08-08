import { Router } from 'express';
import * as adminUserController from '../controllers/adminUserController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', adminUserController.listUsers);
router.get('/:id', adminUserController.getUser);
router.patch('/:id/status', adminUserController.setUserStatus);

export default router;
