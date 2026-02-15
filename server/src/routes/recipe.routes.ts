import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { env } from '../config/env.js';
import * as recipeService from '../services/recipe.service.js';

export const recipeRouter = Router();
recipeRouter.use(authMiddleware);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/recipes/enabled — check if recipe search is available
recipeRouter.get('/enabled', (_req, res) => {
  res.json({ enabled: !!env.SPOONACULAR_API_KEY });
});

// GET /api/recipes/search?q=chicken+parmesan
recipeRouter.get('/search', asyncHandler(async (req, res) => {
  const q = req.query.q as string | undefined;
  if (!q || q.trim().length === 0) throw new AppError(400, 'Search query is required');
  const results = await recipeService.searchRecipes(q.trim());
  res.json(results);
}));

// GET /api/recipes/:id — get full recipe detail with ingredients
recipeRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid recipe ID');
  const detail = await recipeService.getRecipeDetail(id);
  res.json(detail);
}));
