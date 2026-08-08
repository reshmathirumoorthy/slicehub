import asyncHandler from '../utils/asyncHandler.js';
import * as pizzaService from '../services/pizzaService.js';
import { toUploadPath } from '../middleware/upload.js';

export const getPizzas = asyncHandler(async (req, res) => {
  const query = {
    ...req.query,
    admin: req.admin ? 'true' : 'false',
  };

  const result = await pizzaService.listPizzas(query);

  res.status(200).json({
    success: true,
    data: {
      pizzas: result.items,
      pagination: result.pagination,
    },
  });
});

export const getPizza = asyncHandler(async (req, res) => {
  const pizza = await pizzaService.getPizzaById(req.params.id);

  res.status(200).json({
    success: true,
    data: { pizza },
  });
});

export const createPizza = asyncHandler(async (req, res) => {
  const imagePath = req.file
    ? toUploadPath('pizzas', req.file.filename)
    : null;

  const pizza = await pizzaService.createPizza(req.body, imagePath);

  res.status(201).json({
    success: true,
    message: 'Pizza created successfully',
    data: { pizza },
  });
});

export const updatePizza = asyncHandler(async (req, res) => {
  const imagePath = req.file
    ? toUploadPath('pizzas', req.file.filename)
    : undefined;

  const pizza = await pizzaService.updatePizza(
    req.params.id,
    req.body,
    imagePath,
  );

  res.status(200).json({
    success: true,
    message: 'Pizza updated successfully',
    data: { pizza },
  });
});

export const deletePizza = asyncHandler(async (req, res) => {
  await pizzaService.deletePizza(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Pizza deleted successfully',
  });
});
