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
  data: { name: string; category: string; quantity: number; unit: string; itemType?: string },
) {
  const list = await prisma.provisioningList.findFirst({ where: { id: listId, userId } });
  if (!list) return null;
  return prisma.provisioningListItem.create({
    data: { listId, name: data.name, category: data.category, quantity: data.quantity, unit: data.unit, itemType: data.itemType ?? 'trip' },
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

    // Only sync restock items to inventory
    if (item.itemType === 'restock') {
      const existingInventory = await tx.inventoryItem.findFirst({
        where: {
          userId,
          name: item.name,
          category: item.category,
          unit: item.unit,
        },
      });

      if (existingInventory) {
        await tx.inventoryItem.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
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
    }

    return updatedItem;
  });
}

/**
 * Add restock items to an existing provisioning list from inventory shortfalls.
 * Only adds items that aren't already on the list (by name + category + unit).
 */
export async function addRestockItems(listId: string, userId: string) {
  const list = await prisma.provisioningList.findFirst({
    where: { id: listId, userId },
    include: { items: true },
  });
  if (!list) return null;

  // Find inventory shortfalls
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId, targetQuantity: { gt: 0 } },
  });
  const shortfalls = inventoryItems.filter((i) => i.quantity < i.targetQuantity);

  if (shortfalls.length === 0) return { list, added: 0 };

  // Filter out items already on the list (by name + category + unit)
  const existing = new Set(
    list.items.map((i) => `${i.name}|${i.category}|${i.unit}`),
  );
  const toAdd = shortfalls.filter(
    (i) => !existing.has(`${i.name}|${i.category}|${i.unit}`),
  );

  if (toAdd.length === 0) return { list, added: 0 };

  await prisma.provisioningListItem.createMany({
    data: toAdd.map((item) => ({
      listId,
      name: item.name,
      category: item.category,
      quantity: Math.round((item.targetQuantity - item.quantity) * 100) / 100,
      unit: item.unit,
      itemType: 'restock',
    })),
  });

  // Return refreshed list
  const updated = await prisma.provisioningList.findFirst({
    where: { id: listId, userId },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
  return { list: updated, added: toAdd.length };
}

/**
 * Add missing ingredients from a meal to a provisioning list.
 * Checks inventory for on-hand quantities and only adds shortfalls.
 * Skips items already on the list (by name + category + unit).
 */
export async function addMealItems(listId: string, mealId: string, userId: string) {
  const list = await prisma.provisioningList.findFirst({
    where: { id: listId, userId },
    include: { items: true },
  });
  if (!list) return null;

  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId },
    include: { ingredients: true },
  });
  if (!meal) return null;

  // Get inventory to check what's on hand
  const inventory = await prisma.inventoryItem.findMany({ where: { userId } });
  const inventoryMap = new Map(
    inventory.map((i) => [`${i.name.toLowerCase()}|${i.category}|${i.unit}`, i.quantity]),
  );

  // Items already on the list
  const existing = new Set(
    list.items.map((i) => `${i.name.toLowerCase()}|${i.category}|${i.unit}`),
  );

  // Compute shortfalls
  const toAdd = meal.ingredients
    .map((ing) => {
      const key = `${ing.name.toLowerCase()}|${ing.category}|${ing.unit}`;
      const onHand = inventoryMap.get(key) ?? 0;
      const needed = Math.max(0, Math.round((ing.quantity - onHand) * 100) / 100);
      return { ...ing, needed, key };
    })
    .filter((ing) => ing.needed > 0 && !existing.has(ing.key));

  if (toAdd.length === 0) return { added: 0, mealName: meal.name };

  await prisma.provisioningListItem.createMany({
    data: toAdd.map((ing) => ({
      listId,
      name: ing.name,
      category: ing.category,
      quantity: ing.needed,
      unit: ing.unit,
      itemType: 'trip',
    })),
  });

  return { added: toAdd.length, mealName: meal.name };
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
