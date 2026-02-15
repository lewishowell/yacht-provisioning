import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Users,
} from 'lucide-react';
import {
  useMeal,
  useUpdateMeal,
  useAddIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from '../hooks/useMeals';
import type { Category, MealIngredient } from '../types';

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'bottles', 'cans', 'boxes', 'packs', 'rolls'];

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

export function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: meal, isLoading } = useMeal(id!);
  const updateMeal = useUpdateMeal();
  const addIngredient = useAddIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: 'FOOD' as Category, quantity: 1, unit: 'pcs' });
  const [newIng, setNewIng] = useState({ name: '', category: 'FOOD' as Category, quantity: 1, unit: 'pcs' });

  const [editingMeal, setEditingMeal] = useState(false);
  const [mealForm, setMealForm] = useState({ name: '', description: '', servings: 2 });

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIngredient.mutateAsync({ mealId: id!, ...newIng });
    setNewIng({ name: '', category: 'FOOD', quantity: 1, unit: 'pcs' });
    setShowAddForm(false);
  };

  const startEditIngredient = (ing: MealIngredient) => {
    setEditingId(ing.id);
    setEditForm({ name: ing.name, category: ing.category as Category, quantity: ing.quantity, unit: ing.unit });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateIngredient.mutateAsync({ mealId: id!, ingredientId: editingId, ...editForm });
    setEditingId(null);
  };

  const startEditMeal = () => {
    if (!meal) return;
    setMealForm({
      name: meal.name,
      description: meal.description || '',
      servings: meal.servings,
    });
    setEditingMeal(true);
  };

  const handleSaveMeal = async () => {
    await updateMeal.mutateAsync({
      id: id!,
      name: mealForm.name,
      description: mealForm.description || undefined,
      servings: mealForm.servings,
    });
    setEditingMeal(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Meal not found.</p>
        <Link to="/meals" className="text-ocean hover:underline mt-2 inline-block">
          Back to meals
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/meals')}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          {editingMeal ? (
            <div className="space-y-2">
              <input
                className="text-2xl font-bold w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-ocean outline-none"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
              />
              <input
                className="text-sm w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-ocean outline-none"
                value={mealForm.description}
                onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })}
                placeholder="Description..."
              />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={mealForm.servings}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMealForm({ ...mealForm, servings: parseInt(e.target.value) || 1 })}
                />
                <span className="text-sm text-gray-500">servings</span>
                <button
                  onClick={handleSaveMeal}
                  className="ml-2 p-1.5 text-white bg-teal rounded hover:bg-teal-light"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingMeal(false)}
                  className="p-1.5 text-gray-500 bg-gray-100 rounded hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{meal.name}</h1>
                <button onClick={startEditMeal} className="p-1 text-gray-400 hover:text-ocean">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {meal.description && (
                <p className="text-sm text-gray-500 mt-1">{meal.description}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                <Users className="h-3.5 w-3.5" />
                {meal.servings} servings
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-dark">
          <h2 className="font-semibold">Ingredients ({meal.ingredients.length})</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-ocean text-white hover:bg-ocean-light transition-colors"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-sand-dark bg-sand/30">
            <form onSubmit={handleAddIngredient} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={newIng.name}
                  onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={newIng.category}
                  onChange={(e) => setNewIng({ ...newIng, category: e.target.value as Category })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium mb-1">Qty</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={newIng.quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setNewIng({ ...newIng, quantity: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium mb-1">Unit</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={newIng.unit}
                  onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={addIngredient.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-teal text-white hover:bg-teal-light disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {meal.ingredients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No ingredients yet. Add the items needed for this meal.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-dark bg-sand/50 text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Unit</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {meal.ingredients.map((ing) =>
                editingId === ing.id ? (
                  <tr key={ing.id} className="border-b border-sand-dark/50 bg-blue-50/30">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="flex-1 min-w-[120px]">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <select
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                          value={editForm.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 1 })}
                        />
                        <select
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-white bg-teal rounded hover:bg-teal-light"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-500 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={ing.id} className="border-b border-sand-dark/50 hover:bg-sand/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{ing.name}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">
                      {CATEGORIES.find((c) => c.value === ing.category)?.label}
                    </td>
                    <td className="px-4 py-3">{ing.quantity}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">{ing.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditIngredient(ing)}
                          className="p-1 text-gray-400 hover:text-ocean transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteIngredient.mutate({ mealId: id!, ingredientId: ing.id })}
                          className="p-1 text-gray-400 hover:text-coral transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
