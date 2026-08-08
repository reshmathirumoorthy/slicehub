import asyncHandler from '../utils/asyncHandler.js';
import {
  getBuilderCatalog,
  quoteCustomPizza,
} from '../services/pizzaBuilderService.js';

/**
 * GET /api/builder/catalog
 */
export const getCatalog = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: { catalog: getBuilderCatalog() },
  });
});

/**
 * POST /api/builder/quote
 * Server-authoritative price calculation.
 */
export const quote = asyncHandler(async (req, res) => {
  const quoteResult = quoteCustomPizza(req.body);

  res.status(200).json({
    success: true,
    message: 'Quote calculated on server',
    data: { quote: quoteResult },
  });
});
