import { Router } from 'express';
import * as pizzaController from '../controllers/pizzaController.js';
import { optionalAdmin, protectAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAdmin, pizzaController.getPizzas);
router.get('/:id', pizzaController.getPizza);

router.post(
  '/',
  protectAdmin,
  uploadImage('pizzas', 'image'),
  pizzaController.createPizza,
);

router.put(
  '/:id',
  protectAdmin,
  uploadImage('pizzas', 'image'),
  pizzaController.updatePizza,
);

router.delete('/:id', protectAdmin, pizzaController.deletePizza);

export default router;
