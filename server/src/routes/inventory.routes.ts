import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import * as inventoryService from '../services/inventory.service.js';

export const inventoryRouter = Router();
inventoryRouter.use(authMiddleware);

const CategoryEnum = z.enum([
  'FOOD', 'BEVERAGES', 'CLEANING', 'TOILETRIES',
  'DECK_SUPPLIES', 'GALLEY', 'SAFETY', 'OTHER',
]);

const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
  expiryDate: z.string().nullable().optional(),
  reorderThreshold: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

const updateItemSchema = createItemSchema.partial();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/inventory/dashboard-stats
inventoryRouter.get('/dashboard-stats', asyncHandler(async (req, res) => {
  const stats = await inventoryService.getDashboardStats(req.user!.id);
  res.json(stats);
}));

// GET /api/inventory/low-stock
inventoryRouter.get('/low-stock', asyncHandler(async (req, res) => {
  const items = await inventoryService.getLowStockItems(req.user!.id);
  res.json(items);
}));

// GET /api/inventory
inventoryRouter.get('/', asyncHandler(async (req, res) => {
  const { page, pageSize, search, category, sort, order } = req.query;
  const result = await inventoryService.getInventoryItems({
    userId: req.user!.id,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    search: search as string | undefined,
    category: category ? CategoryEnum.parse(category) : undefined,
    sort: sort as string | undefined,
    order: order === 'desc' ? 'desc' : 'asc',
  });
  res.json(result);
}));

// GET /api/inventory/:id
inventoryRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const item = await inventoryService.getInventoryItem(id, req.user!.id);
  if (!item) throw new AppError(404, 'Item not found');
  res.json(item);
}));

// POST /api/inventory
inventoryRouter.post('/', asyncHandler(async (req, res) => {
  const data = createItemSchema.parse(req.body);
  const item = await inventoryService.createInventoryItem(req.user!.id, data);
  res.status(201).json(item);
}));

// PATCH /api/inventory/:id
inventoryRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const data = updateItemSchema.parse(req.body);
  const item = await inventoryService.updateInventoryItem(id, req.user!.id, data);
  if (!item) throw new AppError(404, 'Item not found');
  res.json(item);
}));

// DELETE /api/inventory/:id
inventoryRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const ok = await inventoryService.deleteInventoryItem(id, req.user!.id);
  if (!ok) throw new AppError(404, 'Item not found');
  res.status(204).end();
}));
