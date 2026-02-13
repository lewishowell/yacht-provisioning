import { prisma } from '../lib/prisma.js';

export async function getLists(userId: string) {
  return prisma.provisioningList.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { items: true },
  });
}

export async function getList(id: string, userId: string) {
  return prisma.provisioningList.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function createList(
  userId: string,
  data: { name: string; description?: string },
) {
  return prisma.provisioningList.create({
    data: { userId, name: data.name, description: data.description ?? null },
    include: { items: true },
  });
}

export async function updateList(
  id: string,
  userId: string,
  data: { name?: string; description?: string; status?: string },
) {
  const list = await prisma.provisioningList.findFirst({ where: { id, userId } });
  if (!list) return null;
  return prisma.provisioningList.update({
    where: { id },
    data,
    include: { items: true },
  });
}

export async function deleteList(id: string, userId: string) {
  const list = await prisma.provisioningList.findFirst({ where: { id, userId } });
  if (!list) return false;
  await prisma.provisioningList.delete({ where: { id } });
  return true;
}

export async function addListItem(
  listId: string,
  userId: string,
  data: { name: string; category: string; quantity: number; unit: string },
) {
  const list = await prisma.provisioningList.findFirst({ where: { id: listId, userId } });
  if (!list) return null;
  return prisma.provisioningListItem.create({
    data: { listId, ...data },
  });
}

export async function updateListItem(
  listId: string,
  itemId: string,
  userId: string,
  data: { name?: string; category?: string; quantity?: number; unit?: string },
) {
  const list = await prisma.provisioningList.findFirst({ where: { id: listId, userId } });
  if (!list) return null;
  const item = await prisma.provisioningListItem.findFirst({ where: { id: itemId, listId } });
  if (!item) return null;
  return prisma.provisioningListItem.update({ where: { id: itemId }, data });
}

export async function deleteListItem(listId: string, itemId: string, userId: string) {
  const list = await prisma.provisioningList.findFirst({ where: { id: listId, userId } });
  if (!list) return false;
  const item = await prisma.provisioningListItem.findFirst({ where: { id: itemId, listId } });
  if (!item) return false;
  await prisma.provisioningListItem.delete({ where: { id: itemId } });
  return true;
}

/**
 * Mark a provisioning list item as purchased AND sync to inventory.
 * Uses a Prisma transaction for atomicity:
 * - Find matching inventory item by name + category + unit → increment quantity
 * - Or create a new inventory item
 * - Mark the provisioning list item as purchased
 */
export async function purchaseItem(listId: string, itemId: string, userId: string) {
  const list = await prisma.provisioningList.findFirst({ where: { id: listId, userId } });
  if (!list) return null;

  const item = await prisma.provisioningListItem.findFirst({ where: { id: itemId, listId } });
  if (!item || item.purchased) return null;

  return prisma.$transaction(async (tx) => {
    // Mark as purchased
    const updatedItem = await tx.provisioningListItem.update({
      where: { id: itemId },
      data: { purchased: true, purchasedAt: new Date() },
    });

    // Find matching inventory item
    const existingInventory = await tx.inventoryItem.findFirst({
      where: {
        userId,
        name: item.name,
        category: item.category,
        unit: item.unit,
      },
    });

    if (existingInventory) {
      // Increment quantity
      await tx.inventoryItem.update({
        where: { id: existingInventory.id },
        data: { quantity: { increment: item.quantity } },
      });
    } else {
      // Create new inventory item
      await tx.inventoryItem.create({
        data: {
          userId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          reorderThreshold: 0,
        },
      });
    }

    return updatedItem;
  });
}

export async function exportListCSV(id: string, userId: string) {
  const list = await getList(id, userId);
  if (!list) return null;

  const headers = ['Name', 'string', 'Quantity', 'Unit', 'Purchased', 'Purchased At'];
  const rows = (list.items ?? []).map((item) => [
    item.name,
    item.category,
    String(item.quantity),
    item.unit,
    item.purchased ? 'Yes' : 'No',
    item.purchasedAt ? item.purchasedAt.toISOString() : '',
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}
