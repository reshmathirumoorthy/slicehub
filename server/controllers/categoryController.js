import asyncHandler from '../utils/asyncHandler.js';
import * as categoryService from '../services/categoryService.js';
import { toUploadPath } from '../middleware/upload.js';

export const getCategories = asyncHandler(async (req, res) => {
  const includeInactive =
    req.query.includeInactive === 'true' && Boolean(req.admin);
  const categories = await categoryService.listCategories({ includeInactive });

  res.status(200).json({
    success: true,
    data: { categories },
  });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    data: { category },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const imagePath = req.file
    ? toUploadPath('categories', req.file.filename)
    : null;

  const category = await categoryService.createCategory(req.body, imagePath);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const imagePath = req.file
    ? toUploadPath('categories', req.file.filename)
    : undefined;

  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
    imagePath,
  );

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category },
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});
