export type Category =
  | 'FOOD'
  | 'BEVERAGES'
  | 'CLEANING'
  | 'TOILETRIES'
  | 'DECK_SUPPLIES'
  | 'GALLEY'
  | 'SAFETY'
  | 'OTHER';

export type ListStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  hasSeenOnboarding: boolean;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category: Category;
  quantity: number;
  targetQuantity: number;
  unit: string;
  expiryDate: string | null;
  reorderThreshold: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ListStatus;
  createdAt: string;
  updatedAt: string;
  items?: ProvisioningListItem[];
  _count?: { items: number };
}

export type ItemType = 'restock' | 'trip';

export interface ProvisioningListItem {
  id: string;
  listId: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  itemType: ItemType;
  purchased: boolean;
  purchasedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalItems: number;
  inventoryPct: number;
  lowStockCount: number;
  itemsNeeded: number;
  activeLists: number;
  mealsStocked: number;
  totalMeals: number;
  lowStockItems: InventoryItem[];
  expiringSoon: InventoryItem[];
  recentLists: ProvisioningList[];
}

export interface MealIngredient {
  id: string;
  mealId: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  createdAt: string;
  updatedAt: string;
  ingredients: MealIngredient[];
  _count?: { plannedMeals: number };
}

export interface RecipeSearchResult {
  id: number;
  title: string;
  image: string | null;
  servings: number;
  readyInMinutes: number;
  summary: string;
}

export interface RecipeDetail {
  id: number;
  title: string;
  image: string | null;
  servings: number;
  readyInMinutes: number;
  summary: string;
  sourceUrl: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }[];
}

export interface PlannedMeal {
  id: string;
  mealPlanId: string;
  mealId: string;
  date: string;
  slot: MealSlot;
  meal: Meal;
}

export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  plannedMeals: PlannedMeal[];
}
