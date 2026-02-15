import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import * as mealService from '../services/meal.service.js';

export const mealRouter = Router();
mealRouter.use(authMiddleware);

const CategoryEnum = z.enum([
  'FOOD', 'BEVERAGES', 'CLEANING', 'TOILETRIES',
  'DECK_SUPPLIES', 'GALLEY', 'SAFETY', 'OTHER',
]);

const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
});

const createMealSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  servings: z.number().int().min(1).optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

const updateMealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  servings: z.number().int().min(1).optional(),
});

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/meals
mealRouter.get('/', asyncHandler(async (req, res) => {
  const meals = await mealService.getMeals(req.user!.id);
  res.json(meals);
}));

// POST /api/meals
mealRouter.post('/', asyncHandler(async (req, res) => {
  const data = createMealSchema.parse(req.body) as any;
  const meal = await mealService.createMeal(req.user!.id, data);
  res.status(201).json(meal);
}));

// GET /api/meals/:id
mealRouter.get('/:id', asyncHandler(async (req, res) => {
  const meal = await mealService.getMeal(req.params.id, req.user!.id);
  if (!meal) throw new AppError(404, 'Meal not found');
  res.json(meal);
}));

// PATCH /api/meals/:id
mealRouter.patch('/:id', asyncHandler(async (req, res) => {
  const data = updateMealSchema.parse(req.body);
  const meal = await mealService.updateMeal(req.params.id, req.user!.id, data);
  if (!meal) throw new AppError(404, 'Meal not found');
  res.json(meal);
}));

// DELETE /api/meals/:id
mealRouter.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await mealService.deleteMeal(req.params.id, req.user!.id);
  if (!ok) throw new AppError(404, 'Meal not found');
  res.status(204).end();
}));

// POST /api/meals/:id/ingredients
mealRouter.post('/:id/ingredients', asyncHandler(async (req, res) => {
  const data = ingredientSchema.parse(req.body);
  const ingredient = await mealService.addIngredient(req.params.id, req.user!.id, data);
  if (!ingredient) throw new AppError(404, 'Meal not found');
  res.status(201).json(ingredient);
}));

// PATCH /api/meals/:id/ingredients/:ingredientId
mealRouter.patch('/:id/ingredients/:ingredientId', asyncHandler(async (req, res) => {
  const data = ingredientSchema.partial().parse(req.body);
  const ingredient = await mealService.updateIngredient(
    req.params.id, req.params.ingredientId, req.user!.id, data,
  );
  if (!ingredient) throw new AppError(404, 'Ingredient not found');
  res.json(ingredient);
}));

// DELETE /api/meals/:id/ingredients/:ingredientId
mealRouter.delete('/:id/ingredients/:ingredientId', asyncHandler(async (req, res) => {
  const ok = await mealService.deleteIngredient(
    req.params.id, req.params.ingredientId, req.user!.id,
  );
  if (!ok) throw new AppError(404, 'Ingredient not found');
  res.status(204).end();
}));
