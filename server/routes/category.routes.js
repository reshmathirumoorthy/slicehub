import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { optionalAdmin, protectAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAdmin, categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

router.post(
  '/',
  protectAdmin,
  uploadImage('categories', 'image'),
  categoryController.createCategory,
);

router.put(
  '/:id',
  protectAdmin,
  uploadImage('categories', 'image'),
  categoryController.updateCategory,
);

router.delete('/:id', protectAdmin, categoryController.deleteCategory);

export default router;
