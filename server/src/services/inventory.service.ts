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

  const allowedSortFields = ['name', 'category', 'quantity', 'unit', 'expiryDate', 'createdAt'];
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
  // SQLite doesn't support column-to-column comparison in Prisma,
  // so we fetch candidates and filter in JS
  const items = await prisma.inventoryItem.findMany({
    where: { userId, reorderThreshold: { gt: 0 } },
  });
  return items.filter((i) => i.quantity <= i.reorderThreshold);
}

export async function getDashboardStats(userId: string) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    totalItems,
    lowStockItems,
    expiringSoon,
    activeLists,
    pendingPurchases,
    recentLists,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { userId } }),
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
    prisma.provisioningListItem.count({
      where: {
        purchased: false,
        list: { userId, status: { in: ['ACTIVE', 'DRAFT'] } },
      },
    }),
    prisma.provisioningList.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { items: true },
    }),
  ]);

  return {
    totalItems,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    expiringSoon,
    activeLists,
    pendingPurchases,
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
