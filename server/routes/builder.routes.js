import { Router } from 'express';
import * as pizzaBuilderController from '../controllers/pizzaBuilderController.js';

const router = Router();

router.get('/catalog', pizzaBuilderController.getCatalog);
router.post('/quote', pizzaBuilderController.quote);

export default router;
