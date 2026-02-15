import { prisma } from '../lib/prisma.js';

export async function getMeals(userId: string) {
  return prisma.meal.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { ingredients: true, _count: { select: { plannedMeals: true } } },
  });
}

export async function getMeal(id: string, userId: string) {
  return prisma.meal.findFirst({
    where: { id, userId },
    include: { ingredients: true },
  });
}

export async function createMeal(
  userId: string,
  data: {
    name: string;
    description?: string;
    servings?: number;
    ingredients?: { name: string; category: string; quantity: number; unit: string }[];
  },
) {
  return prisma.meal.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      servings: data.servings ?? 2,
      ingredients: data.ingredients
        ? { create: data.ingredients }
        : undefined,
    },
    include: { ingredients: true },
  });
}

export async function updateMeal(
  id: string,
  userId: string,
  data: { name?: string; description?: string; servings?: number },
) {
  const meal = await prisma.meal.findFirst({ where: { id, userId } });
  if (!meal) return null;
  return prisma.meal.update({
    where: { id },
    data,
    include: { ingredients: true },
  });
}

export async function deleteMeal(id: string, userId: string) {
  const meal = await prisma.meal.findFirst({ where: { id, userId } });
  if (!meal) return false;
  await prisma.meal.delete({ where: { id } });
  return true;
}

export async function addIngredient(
  mealId: string,
  userId: string,
  data: { name: string; category: string; quantity: number; unit: string },
) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) return null;
  return prisma.mealIngredient.create({
    data: { mealId, ...data },
  });
}

export async function updateIngredient(
  mealId: string,
  ingredientId: string,
  userId: string,
  data: { name?: string; category?: string; quantity?: number; unit?: string },
) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) return null;
  const ingredient = await prisma.mealIngredient.findFirst({
    where: { id: ingredientId, mealId },
  });
  if (!ingredient) return null;
  return prisma.mealIngredient.update({ where: { id: ingredientId }, data });
}

export async function deleteIngredient(
  mealId: string,
  ingredientId: string,
  userId: string,
) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) return false;
  const ingredient = await prisma.mealIngredient.findFirst({
    where: { id: ingredientId, mealId },
  });
  if (!ingredient) return false;
  await prisma.mealIngredient.delete({ where: { id: ingredientId } });
  return true;
}
