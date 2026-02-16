import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import * as provisioningService from '../services/provisioning.service.js';

export const provisioningRouter = Router();
provisioningRouter.use(authMiddleware);

const CategoryEnum = z.enum([
  'FOOD', 'BEVERAGES', 'CLEANING', 'TOILETRIES',
  'DECK_SUPPLIES', 'GALLEY', 'SAFETY', 'OTHER',
]);

const StatusEnum = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);

const createListSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

const updateListSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: StatusEnum.optional(),
});

const ItemTypeEnum = z.enum(['restock', 'trip']);

const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
  itemType: ItemTypeEnum.optional(),
});

const updateItemSchema = createItemSchema.partial();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/provisioning-lists
provisioningRouter.get('/', asyncHandler(async (req, res) => {
  const lists = await provisioningService.getLists(req.user!.id);
  res.json(lists);
}));

// POST /api/provisioning-lists
provisioningRouter.post('/', asyncHandler(async (req, res) => {
  const data = createListSchema.parse(req.body) as any;
  const list = await provisioningService.createList(req.user!.id, data);
  res.status(201).json(list);
}));

// GET /api/provisioning-lists/:id
provisioningRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const list = await provisioningService.getList(id, req.user!.id);
  if (!list) throw new AppError(404, 'List not found');
  res.json(list);
}));

// GET /api/provisioning-lists/:id/export
provisioningRouter.get('/:id/export', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const csv = await provisioningService.exportListCSV(id, req.user!.id);
  if (!csv) throw new AppError(404, 'List not found');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="provisioning-list.csv"');
  res.send(csv);
}));

// PATCH /api/provisioning-lists/:id
provisioningRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const data = updateListSchema.parse(req.body);
  const list = await provisioningService.updateList(id, req.user!.id, data);
  if (!list) throw new AppError(404, 'List not found');
  res.json(list);
}));

// DELETE /api/provisioning-lists/:id
provisioningRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const ok = await provisioningService.deleteList(id, req.user!.id);
  if (!ok) throw new AppError(404, 'List not found');
  res.status(204).end();
}));

// POST /api/provisioning-lists/:id/add-restock-items
provisioningRouter.post('/:id/add-restock-items', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const result = await provisioningService.addRestockItems(id, req.user!.id);
  if (!result) throw new AppError(404, 'List not found');
  res.json(result);
}));

// POST /api/provisioning-lists/:id/add-meal-items — add missing ingredients from a meal
provisioningRouter.post('/:id/add-meal-items', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { mealId } = z.object({ mealId: z.string().min(1) }).parse(req.body);
  const result = await provisioningService.addMealItems(id, mealId, req.user!.id);
  if (!result) throw new AppError(404, 'List or meal not found');
  res.json(result);
}));

// POST /api/provisioning-lists/:id/items
provisioningRouter.post('/:id/items', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const data = createItemSchema.parse(req.body) as any;
  const item = await provisioningService.addListItem(id, req.user!.id, data);
  if (!item) throw new AppError(404, 'List not found');
  res.status(201).json(item);
}));

// PATCH /api/provisioning-lists/:id/items/:itemId
provisioningRouter.patch('/:id/items/:itemId', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const itemId = req.params.itemId as string;
  const data = updateItemSchema.parse(req.body);
  const item = await provisioningService.updateListItem(id, itemId, req.user!.id, data);
  if (!item) throw new AppError(404, 'Item not found');
  res.json(item);
}));

// DELETE /api/provisioning-lists/:id/items/:itemId
provisioningRouter.delete('/:id/items/:itemId', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const itemId = req.params.itemId as string;
  const ok = await provisioningService.deleteListItem(id, itemId, req.user!.id);
  if (!ok) throw new AppError(404, 'Item not found');
  res.status(204).end();
}));

// POST /api/provisioning-lists/:id/items/:itemId/purchase
provisioningRouter.post('/:id/items/:itemId/purchase', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const itemId = req.params.itemId as string;
  const item = await provisioningService.purchaseItem(id, itemId, req.user!.id);
  if (!item) throw new AppError(404, 'Item not found or already purchased');
  res.json(item);
}));
