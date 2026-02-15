import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

interface InventoryFilters {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function getInventoryItems(filters: InventoryFilters) {
  const {
    userId,
    page = 1,
    pageSize = 20,
    search,
    category,
    sort = 'name',
    order = 'asc',
  } = filters;

  const where: Prisma.InventoryItemWhereInput = { userId };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }

  const allowedSortFields = ['name', 'category', 'quantity', 'targetQuantity', 'unit', 'expiryDate', 'createdAt'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'name';

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLowStockItems(userId: string) {
  // Items that are below their target quantity (envelope shortfall)
  const items = await prisma.inventoryItem.findMany({
    where: { userId, targetQuantity: { gt: 0 } },
  });
  return items.filter((i) => i.quantity < i.targetQuantity);
}

export async function getDashboardStats(userId: string) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    allItems,
    lowStockItems,
    expiringSoon,
    activeLists,
    recentLists,
    meals,
  ] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { userId } }),
    getLowStockItems(userId),
    prisma.inventoryItem.findMany({
      where: {
        userId,
        expiryDate: { not: null, lte: sevenDaysFromNow, gte: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    }),
    prisma.provisioningList.count({
      where: { userId, status: 'ACTIVE' },
    }),
    prisma.provisioningList.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { items: true },
    }),
    prisma.meal.findMany({
      where: { userId },
      include: { ingredients: true },
    }),
  ]);

  // Inventory status: % of items with targets that are at or above target
  const itemsWithTargets = allItems.filter((i) => i.targetQuantity > 0);
  const stockedItems = itemsWithTargets.filter((i) => i.quantity >= i.targetQuantity);
  const inventoryPct = itemsWithTargets.length > 0
    ? Math.round((stockedItems.length / itemsWithTargets.length) * 100)
    : 100;

  // Items needed: sum of shortfall quantities across all below-target items
  const itemsNeeded = lowStockItems.reduce((sum, i) => {
    return sum + Math.round((i.targetQuantity - i.quantity) * 100) / 100;
  }, 0);

  // Meals stocked: meals where ALL ingredients are available in inventory
  const inventoryMap = new Map(
    allItems.map((i) => [`${i.name}|${i.category}|${i.unit}`, i.quantity]),
  );
  let mealsStocked = 0;
  for (const meal of meals) {
    if (meal.ingredients.length === 0) continue;
    const fullyStocked = meal.ingredients.every((ing) => {
      const key = `${ing.name}|${ing.category}|${ing.unit}`;
      const onHand = inventoryMap.get(key) ?? 0;
      return onHand >= ing.quantity;
    });
    if (fullyStocked) mealsStocked++;
  }

  return {
    totalItems: allItems.length,
    inventoryPct,
    lowStockCount: lowStockItems.length,
    itemsNeeded: Math.round(itemsNeeded * 100) / 100,
    lowStockItems,
    expiringSoon,
    activeLists,
    mealsStocked,
    totalMeals: meals.length,
    recentLists,
  };
}

export async function getInventoryItem(id: string, userId: string) {
  return prisma.inventoryItem.findFirst({ where: { id, userId } });
}

export async function createInventoryItem(
  userId: string,
  data: {
    name: string;
    category: string;
    quantity: number;
    targetQuantity?: number;
    unit: string;
    expiryDate?: string | null;
    reorderThreshold?: number;
    notes?: string | null;
  },
) {
  return prisma.inventoryItem.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      targetQuantity: data.targetQuantity ?? 0,
      unit: data.unit,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      reorderThreshold: data.reorderThreshold ?? 0,
      notes: data.notes ?? null,
    },
  });
}

export async function updateInventoryItem(
  id: string,
  userId: string,
  data: {
    name?: string;
    category?: string;
    quantity?: number;
    targetQuantity?: number;
    unit?: string;
    expiryDate?: string | null;
    reorderThreshold?: number;
    notes?: string | null;
  },
) {
  const item = await prisma.inventoryItem.findFirst({ where: { id, userId } });
  if (!item) return null;

  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...data,
      expiryDate: data.expiryDate !== undefined
        ? (data.expiryDate ? new Date(data.expiryDate) : null)
        : undefined,
    },
  });
}

export async function deleteInventoryItem(id: string, userId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { id, userId } });
  if (!item) return false;
  await prisma.inventoryItem.delete({ where: { id } });
  return true;
}

/**
 * Generate a provisioning (shopping) list from all inventory shortfalls.
 * For each item where quantity < targetQuantity, the needed amount is added
 * as a provisioning list item.
 */
export async function generateShoppingList(userId: string, name?: string) {
  // Find all items with a shortfall
  const items = await prisma.inventoryItem.findMany({
    where: { userId, targetQuantity: { gt: 0 } },
  });
  const shortfalls = items.filter((i) => i.quantity < i.targetQuantity);

  if (shortfalls.length === 0) return null;

  const listName = name || `Restock — ${new Date().toLocaleDateString()}`;

  return prisma.provisioningList.create({
    data: {
      userId,
      name: listName,
      description: `Auto-generated from ${shortfalls.length} item${shortfalls.length === 1 ? '' : 's'} below target`,
      status: 'DRAFT',
      items: {
        create: shortfalls.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: Math.round((item.targetQuantity - item.quantity) * 100) / 100,
          unit: item.unit,
          itemType: 'restock',
        })),
      },
    },
    include: { items: true },
  });
}
