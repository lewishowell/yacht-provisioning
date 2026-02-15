import { prisma } from '../lib/prisma.js';

export async function getMealPlans(userId: string) {
  return prisma.mealPlan.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
    include: {
      plannedMeals: {
        include: { meal: true },
        orderBy: [{ date: 'asc' }, { slot: 'asc' }],
      },
    },
  });
}

export async function getMealPlan(id: string, userId: string) {
  return prisma.mealPlan.findFirst({
    where: { id, userId },
    include: {
      plannedMeals: {
        include: { meal: { include: { ingredients: true } } },
        orderBy: [{ date: 'asc' }, { slot: 'asc' }],
      },
    },
  });
}

export async function createMealPlan(
  userId: string,
  data: { name: string; startDate: string; endDate: string },
) {
  return prisma.mealPlan.create({
    data: {
      userId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    include: { plannedMeals: { include: { meal: true } } },
  });
}

export async function updateMealPlan(
  id: string,
  userId: string,
  data: { name?: string; startDate?: string; endDate?: string },
) {
  const plan = await prisma.mealPlan.findFirst({ where: { id, userId } });
  if (!plan) return null;
  return prisma.mealPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    },
    include: { plannedMeals: { include: { meal: true } } },
  });
}

export async function deleteMealPlan(id: string, userId: string) {
  const plan = await prisma.mealPlan.findFirst({ where: { id, userId } });
  if (!plan) return false;
  await prisma.mealPlan.delete({ where: { id } });
  return true;
}

export async function addPlannedMeal(
  mealPlanId: string,
  userId: string,
  data: { mealId: string; date: string; slot: string },
) {
  const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } });
  if (!plan) return null;
  return prisma.plannedMeal.create({
    data: {
      mealPlanId,
      mealId: data.mealId,
      date: new Date(data.date),
      slot: data.slot,
    },
    include: { meal: true },
  });
}

export async function removePlannedMeal(
  mealPlanId: string,
  plannedMealId: string,
  userId: string,
) {
  const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } });
  if (!plan) return false;
  const pm = await prisma.plannedMeal.findFirst({
    where: { id: plannedMealId, mealPlanId },
  });
  if (!pm) return false;
  await prisma.plannedMeal.delete({ where: { id: plannedMealId } });
  return true;
}

/**
 * Generate a provisioning list from a meal plan.
 * Aggregates all ingredients across planned meals, checks inventory,
 * and creates a provisioning list with shortfall items.
 */
export async function generateProvisioningList(id: string, userId: string) {
  const plan = await prisma.mealPlan.findFirst({
    where: { id, userId },
    include: {
      plannedMeals: {
        include: { meal: { include: { ingredients: true } } },
      },
    },
  });
  if (!plan) return null;

  // Aggregate ingredients across all planned meals
  const aggregated = new Map<string, { name: string; category: string; quantity: number; unit: string }>();
  for (const pm of plan.plannedMeals) {
    for (const ing of pm.meal.ingredients) {
      const key = `${ing.name}|${ing.category}|${ing.unit}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        aggregated.set(key, {
          name: ing.name,
          category: ing.category,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }
    }
  }

  if (aggregated.size === 0) return null;

  // Check inventory for what we already have
  const inventory = await prisma.inventoryItem.findMany({ where: { userId } });
  const inventoryMap = new Map(
    inventory.map((i) => [`${i.name}|${i.category}|${i.unit}`, i.quantity]),
  );

  const items: { name: string; category: string; quantity: number; unit: string; itemType: string }[] = [];
  for (const [key, needed] of aggregated) {
    const onHand = inventoryMap.get(key) ?? 0;
    const shortfall = Math.round((needed.quantity - onHand) * 100) / 100;
    if (shortfall > 0) {
      items.push({
        name: needed.name,
        category: needed.category,
        quantity: shortfall,
        unit: needed.unit,
        itemType: 'trip',
      });
    }
  }

  // Create provisioning list
  const list = await prisma.provisioningList.create({
    data: {
      userId,
      name: `Meal Plan: ${plan.name}`,
      description: `Generated from meal plan "${plan.name}"`,
      items: items.length > 0 ? { create: items } : undefined,
    },
    include: { items: true },
  });

  return list;
}
