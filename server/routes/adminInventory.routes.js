import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = Router();

router.use(protectAdmin);

router.get('/', inventoryController.listInventory);
router.get('/low-stock', inventoryController.listLowStock);
router.get('/out-of-stock', inventoryController.listOutOfStock);
router.post('/check-alerts', inventoryController.triggerLowStockCheck);
router.post('/', inventoryController.createInventoryItem);
router.get('/:id', inventoryController.getInventoryItem);
router.patch('/:id', inventoryController.updateInventoryItem);
router.post('/:id/add-stock', inventoryController.addStock);
router.post('/:id/adjust', inventoryController.adjustStock);
router.patch('/:id/threshold', inventoryController.setThreshold);

export default router;
