import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UtensilsCrossed, Trash2, X, Users, ChevronRight } from 'lucide-react';
import { useMeals, useCreateMeal, useDeleteMeal } from '../hooks/useMeals';
import type { Category, Meal } from '../types';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'FOOD', label: 'Food' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'TOILETRIES', label: 'Toiletries' },
  { value: 'DECK_SUPPLIES', label: 'Deck Supplies' },
  { value: 'GALLEY', label: 'Galley' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const UNITS = ['pcs', 'lbs', 'oz', 'gal', 'qt', 'fl oz', 'cups', 'bottles', 'cans', 'boxes', 'packs', 'rolls'];

function CreateMealModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<
    { name: string; category: Category; quantity: number; unit: string }[]
  >([]);
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState<Category>('FOOD');
  const [ingQty, setIngQty] = useState(1);
  const [ingUnit, setIngUnit] = useState('pcs');
  const createMutation = useCreateMeal();

  const handleAddIngredient = () => {
    if (!ingName.trim()) return;
    setIngredients([
      ...ingredients,
      { name: ingName.trim(), category: ingCategory, quantity: ingQty, unit: ingUnit },
    ]);
    setIngName('');
    setIngQty(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      name,
      description: description || undefined,
      servings,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
        <h2 className="text-lg font-bold mb-4">New Meal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grilled Fish Tacos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or recipe..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Servings</label>
            <input
              type="number"
              min={1}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={servings}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Inline ingredient adder */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingredients</label>
            {ingredients.length > 0 && (
              <div className="space-y-1 mb-3">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-sand rounded-lg px-3 py-1.5">
                    <span className="flex-1">{ing.quantity} {ing.unit} {ing.name}</span>
                    <button
                      type="button"
                      onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-coral"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-end">
              <input
                className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                placeholder="Ingredient name"
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIngredient();
                  }
                }}
              />
              <input
                type="number"
                min="0.01"
                step="any"
                className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={ingQty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setIngQty(parseFloat(e.target.value) || 1)}
              />
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={ingUnit}
                onChange={(e) => setIngUnit(e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={ingCategory}
                onChange={(e) => setIngCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-1.5 text-sm rounded-lg bg-teal text-white hover:bg-teal-light"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-ocean text-white hover:bg-ocean-light disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MealCard({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow relative group">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm('Delete this meal?')) onDelete();
        }}
        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <Link to={`/meals/${meal.id}`}>
        <h3 className="font-semibold text-lg mb-1">{meal.name}</h3>
        {meal.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{meal.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {meal.servings} servings
          </span>
          <span>{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-ocean">
          View details <ChevronRight className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

export function MealsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: meals, isLoading } = useMeals();
  const deleteMutation = useDeleteMeal();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meals</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-lg hover:bg-ocean-light transition-colors"
        >
          <Plus className="h-4 w-4" /> New Meal
        </button>
      </div>

      {!meals || meals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No meals yet. Build your meal library to start planning.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-ocean hover:underline text-sm"
          >
            Create your first meal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDelete={() => deleteMutation.mutate(meal.id)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateMealModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
