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
  PackageCheck,
  ShoppingCart,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  useMeal,
  useUpdateMeal,
  useAddIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useCheckInventory,
} from '../hooks/useMeals';
import {
  useProvisioningLists,
  useCreateList,
  useAddMealItems,
} from '../hooks/useProvisioningLists';
import type { Category, MealIngredient } from '../types';

const UNITS = ['pcs', 'lbs', 'oz', 'gal', 'qt', 'fl oz', 'cups', 'bottles', 'cans', 'boxes', 'packs', 'rolls'];

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

  // Inventory check state
  const [showInventoryCheck, setShowInventoryCheck] = useState(false);
  const { data: inventoryCheck, isLoading: checkLoading } = useCheckInventory(id!, showInventoryCheck);

  // Add to list state
  const [showAddToList, setShowAddToList] = useState(false);
  const { data: lists } = useProvisioningLists();
  const createList = useCreateList();
  const addMealItems = useAddMealItems();
  const [addResult, setAddResult] = useState<{ added: number; mealName: string } | null>(null);

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

  const handleAddToExistingList = async (listId: string) => {
    const result = await addMealItems.mutateAsync({ listId, mealId: id! });
    setAddResult(result);
  };

  const handleAddToNewList = async () => {
    const list = await createList.mutateAsync({ name: `${meal?.name ?? 'Meal'} Shopping List` });
    const result = await addMealItems.mutateAsync({ listId: list.id, mealId: id! });
    setAddResult(result);
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

  const missingCount = inventoryCheck?.filter((i) => !i.inStock).length ?? 0;
  const totalChecked = inventoryCheck?.length ?? 0;

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

      {/* Action buttons */}
      {meal.ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setShowInventoryCheck(!showInventoryCheck); setAddResult(null); }}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
              showInventoryCheck
                ? 'border-teal bg-teal/5 text-teal'
                : 'border-gray-300 hover:border-teal hover:text-teal'
            }`}
          >
            <PackageCheck className="h-4 w-4" /> Check Inventory
          </button>
          <button
            onClick={() => { setShowAddToList(!showAddToList); setAddResult(null); }}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
              showAddToList
                ? 'border-ocean bg-ocean/5 text-ocean'
                : 'border-gray-300 hover:border-ocean hover:text-ocean'
            }`}
          >
            <ShoppingCart className="h-4 w-4" /> Add to Shopping List
          </button>
        </div>
      )}

      {/* Inventory check panel */}
      {showInventoryCheck && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold mb-3">Inventory Check</h3>
          {checkLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-ocean" />
            </div>
          ) : inventoryCheck ? (
            <>
              <div className="text-sm mb-3">
                {missingCount === 0 ? (
                  <span className="text-teal flex items-center gap-1">
                    <Check className="h-4 w-4" /> All {totalChecked} ingredients in stock!
                  </span>
                ) : (
                  <span className="text-amber flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> {missingCount} of {totalChecked} ingredients need restocking
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {inventoryCheck.map((ing) => (
                  <div
                    key={ing.id}
                    className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                      ing.inStock ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {ing.inStock ? (
                        <Check className="h-4 w-4 text-teal flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-coral flex-shrink-0" />
                      )}
                      <span className="font-medium">{ing.name}</span>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <span>Need {ing.quantity} {ing.unit}</span>
                      <span className="mx-1">/</span>
                      <span>Have {ing.onHand}</span>
                      {!ing.inStock && (
                        <span className="ml-2 text-coral font-medium">
                          (need {ing.needed} more)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {missingCount > 0 && (
                <button
                  onClick={() => { setShowInventoryCheck(false); setShowAddToList(true); }}
                  className="mt-3 flex items-center gap-2 text-sm text-ocean hover:underline"
                >
                  <ShoppingCart className="h-4 w-4" /> Add missing items to a shopping list
                </button>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Add to shopping list panel */}
      {showAddToList && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold mb-3">Add to Shopping List</h3>
          <p className="text-sm text-gray-500 mb-3">
            Missing ingredients (not in your inventory) will be added to the selected list.
          </p>

          {addResult !== null ? (
            <div className="text-sm">
              {addResult.added > 0 ? (
                <span className="text-teal flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Added {addResult.added} missing ingredient{addResult.added !== 1 ? 's' : ''} to the list.
                </span>
              ) : (
                <span className="text-gray-500">
                  No missing ingredients to add (everything is in stock or already on the list).
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleAddToNewList}
                disabled={addMealItems.isPending || createList.isPending}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-dashed border-ocean text-ocean hover:bg-ocean/5 transition-colors text-sm disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create new shopping list
                </span>
                {(addMealItems.isPending || createList.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </button>

              {lists && lists.filter((l) => l.status !== 'COMPLETED' && l.status !== 'ARCHIVED').length > 0 && (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-wide pt-2">
                    Or add to existing list
                  </div>
                  {lists
                    .filter((l) => l.status !== 'COMPLETED' && l.status !== 'ARCHIVED')
                    .map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleAddToExistingList(list.id)}
                        disabled={addMealItems.isPending}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-ocean hover:bg-ocean/5 transition-colors text-sm text-left disabled:opacity-50"
                      >
                        <div>
                          <span className="font-medium">{list.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{list.status}</span>
                        </div>
                        {addMealItems.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin text-ocean" />
                        )}
                      </button>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

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
