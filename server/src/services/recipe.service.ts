import { env } from '../config/env.js';

const BASE_URL = 'https://api.spoonacular.com';

interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string | null;
}

interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  image: string | null;
  servings: number;
  readyInMinutes: number;
  summary: string;
  sourceUrl: string;
  extendedIngredients: SpoonacularIngredient[];
}

interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string | null;
}

const AISLE_TO_CATEGORY: Record<string, string> = {
  'produce': 'FOOD',
  'meat': 'FOOD',
  'seafood': 'FOOD',
  'bakery/bread': 'FOOD',
  'baking': 'FOOD',
  'pasta and rice': 'FOOD',
  'canned and jarred': 'FOOD',
  'frozen': 'FOOD',
  'dairy': 'FOOD',
  'cheese': 'FOOD',
  'eggs': 'FOOD',
  'condiments': 'FOOD',
  'spices and seasonings': 'FOOD',
  'oil, vinegar, salad dressing': 'FOOD',
  'nuts': 'FOOD',
  'cereal': 'FOOD',
  'sweet snacks': 'FOOD',
  'savory snacks': 'FOOD',
  'ethnic foods': 'FOOD',
  'beverages': 'BEVERAGES',
  'alcoholic beverages': 'BEVERAGES',
  'tea and coffee': 'BEVERAGES',
  'milk, eggs, other dairy': 'FOOD',
  'health foods': 'FOOD',
  'cleaning products': 'CLEANING',
};

function mapAisleToCategory(aisle: string | null): string {
  if (!aisle) return 'FOOD';
  const lower = aisle.toLowerCase();
  for (const [key, category] of Object.entries(AISLE_TO_CATEGORY)) {
    if (lower.includes(key)) return category;
  }
  return 'FOOD';
}

// Normalize Spoonacular units to app-friendly units
const UNIT_MAP: Record<string, string> = {
  '': 'pcs',
  'serving': 'pcs',
  'servings': 'pcs',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'Tbsp': 'tbsp',
  'Tbsps': 'tbsp',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'cup': 'cups',
  'ounce': 'oz',
  'ounces': 'oz',
  'pound': 'lbs',
  'pounds': 'lbs',
  'lb': 'lbs',
  'gallon': 'gal',
  'gallons': 'gal',
  'quart': 'qt',
  'quarts': 'qt',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'fl. oz.': 'fl oz',
  'clove': 'pcs',
  'cloves': 'pcs',
  'pinch': 'pcs',
  'dash': 'pcs',
  'large': 'pcs',
  'medium': 'pcs',
  'small': 'pcs',
  'piece': 'pcs',
  'pieces': 'pcs',
  'slice': 'pcs',
  'slices': 'pcs',
  'can': 'cans',
  'bottle': 'bottles',
  'bunch': 'pcs',
  'handful': 'pcs',
  'stalk': 'pcs',
  'stalks': 'pcs',
  'sprig': 'pcs',
  'sprigs': 'pcs',
  'leaf': 'pcs',
  'leaves': 'pcs',
};

function normalizeUnit(unit: string): string {
  if (UNIT_MAP[unit] !== undefined) return UNIT_MAP[unit];
  if (UNIT_MAP[unit.toLowerCase()] !== undefined) return UNIT_MAP[unit.toLowerCase()];
  // Keep short units as-is (g, ml, kg, L, etc.)
  return unit.toLowerCase() || 'pcs';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function searchRecipes(query: string, number = 12) {
  const apiKey = env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error('Spoonacular API key not configured');

  const params = new URLSearchParams({
    apiKey,
    query,
    number: String(number),
    addRecipeInformation: 'true',
  });

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data.results as SpoonacularRecipeDetail[]).map((r) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    servings: r.servings,
    readyInMinutes: r.readyInMinutes,
    summary: stripHtml(r.summary).slice(0, 300),
  }));
}

export async function getRecipeDetail(recipeId: number) {
  const apiKey = env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error('Spoonacular API key not configured');

  const params = new URLSearchParams({ apiKey });
  const res = await fetch(`${BASE_URL}/recipes/${recipeId}/information?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spoonacular API error: ${res.status} ${text}`);
  }

  const r: SpoonacularRecipeDetail = await res.json();

  return {
    id: r.id,
    title: r.title,
    image: r.image,
    servings: r.servings,
    readyInMinutes: r.readyInMinutes,
    summary: stripHtml(r.summary).slice(0, 500),
    sourceUrl: r.sourceUrl,
    ingredients: r.extendedIngredients.map((ing) => ({
      name: ing.name,
      quantity: Math.round(ing.amount * 100) / 100,
      unit: normalizeUnit(ing.unit),
      category: mapAisleToCategory(ing.aisle),
    })),
  };
}
