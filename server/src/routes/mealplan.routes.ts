import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import * as mealplanService from '../services/mealplan.service.js';

export const mealplanRouter = Router();
mealplanRouter.use(authMiddleware);

const SlotEnum = z.enum(['breakfast', 'lunch', 'dinner']);

const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  startDate: z.string(),
  endDate: z.string(),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const addPlannedMealSchema = z.object({
  mealId: z.string().min(1),
  date: z.string(),
  slot: SlotEnum,
});

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/meal-plans
mealplanRouter.get('/', asyncHandler(async (req, res) => {
  const plans = await mealplanService.getMealPlans(req.user!.id);
  res.json(plans);
}));

// POST /api/meal-plans
mealplanRouter.post('/', asyncHandler(async (req, res) => {
  const data = createPlanSchema.parse(req.body);
  const plan = await mealplanService.createMealPlan(req.user!.id, data);
  res.status(201).json(plan);
}));

// GET /api/meal-plans/:id
mealplanRouter.get('/:id', asyncHandler(async (req, res) => {
  const plan = await mealplanService.getMealPlan(req.params.id, req.user!.id);
  if (!plan) throw new AppError(404, 'Meal plan not found');
  res.json(plan);
}));

// PATCH /api/meal-plans/:id
mealplanRouter.patch('/:id', asyncHandler(async (req, res) => {
  const data = updatePlanSchema.parse(req.body);
  const plan = await mealplanService.updateMealPlan(req.params.id, req.user!.id, data);
  if (!plan) throw new AppError(404, 'Meal plan not found');
  res.json(plan);
}));

// DELETE /api/meal-plans/:id
mealplanRouter.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await mealplanService.deleteMealPlan(req.params.id, req.user!.id);
  if (!ok) throw new AppError(404, 'Meal plan not found');
  res.status(204).end();
}));

// POST /api/meal-plans/:id/meals — add a meal to a slot
mealplanRouter.post('/:id/meals', asyncHandler(async (req, res) => {
  const data = addPlannedMealSchema.parse(req.body);
  const pm = await mealplanService.addPlannedMeal(req.params.id, req.user!.id, data);
  if (!pm) throw new AppError(404, 'Meal plan not found');
  res.status(201).json(pm);
}));

// DELETE /api/meal-plans/:id/meals/:plannedMealId
mealplanRouter.delete('/:id/meals/:plannedMealId', asyncHandler(async (req, res) => {
  const ok = await mealplanService.removePlannedMeal(
    req.params.id, req.params.plannedMealId, req.user!.id,
  );
  if (!ok) throw new AppError(404, 'Planned meal not found');
  res.status(204).end();
}));

// POST /api/meal-plans/:id/generate-list — create provisioning list from plan
mealplanRouter.post('/:id/generate-list', asyncHandler(async (req, res) => {
  const list = await mealplanService.generateProvisioningList(req.params.id, req.user!.id);
  if (!list) throw new AppError(404, 'Meal plan not found or has no ingredients');
  res.status(201).json(list);
}));
