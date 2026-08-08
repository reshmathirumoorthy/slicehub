import { Router } from 'express';
import * as addressController from '../controllers/addressController.js';
import { protectUser } from '../middleware/auth.js';

const router = Router();

router.use(protectUser);

router.get('/', addressController.listAddresses);
router.post('/', addressController.createAddress);
router.patch('/:id/default', addressController.setDefaultAddress);
router.patch('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;
