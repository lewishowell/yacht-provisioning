import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Download,
  Printer,
  Check,
  Trash2,
  Pencil,
  Save,
  X,
  PackagePlus,
  UtensilsCrossed,
} from 'lucide-react';
import {
  useProvisioningList,
  useUpdateList,
  useAddListItem,
  useUpdateListItem,
  useDeleteListItem,
  usePurchaseItem,
  useAddRestockItems,
  useAddMealItems,
} from '../hooks/useProvisioningLists';
import { useMeals } from '../hooks/useMeals';
import type { Category, ListStatus, ProvisioningListItem } from '../types';

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

const STATUS_OPTIONS: { value: ListStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading } = useProvisioningList(id!);
  const updateList = useUpdateList();
  const addItem = useAddListItem();
  const updateItem = useUpdateListItem();
  const deleteItem = useDeleteListItem();
  const purchaseItem = usePurchaseItem();
  const addRestockItems = useAddRestockItems();
  const addMealItems = useAddMealItems();
  const { data: allMeals } = useMeals();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [mealAddResult, setMealAddResult] = useState<{ added: number; mealName: string } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: 'FOOD' as Category, quantity: 1, unit: '' });
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'FOOD' as Category,
    quantity: 1,
    unit: 'pcs',
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem.mutateAsync({ listId: id!, ...newItem, itemType: 'trip' });
    setNewItem({ name: '', category: 'FOOD', quantity: 1, unit: 'pcs' });
    setShowAddForm(false);
  };

  const handleAddRestockItems = async () => {
    await addRestockItems.mutateAsync(id!);
  };

  const handleExportCSV = () => {
    if (!list?.items) return;
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Type', 'Purchased'];
    const rows = list.items.map((item) => [
      item.name,
      item.category,
      String(item.quantity),
      item.unit,
      item.itemType === 'restock' ? 'Restock' : 'Trip',
      item.purchased ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (item: { id: string; name: string; category: Category; quantity: number; unit: string }) => {
    setEditingItemId(item.id);
    setEditForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit });
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    await updateItem.mutateAsync({ listId: id!, itemId: editingItemId, ...editForm });
    setEditingItemId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">List not found.</p>
        <Link to="/provisioning" className="text-ocean hover:underline mt-2 inline-block">
          Back to lists
        </Link>
      </div>
    );
  }

  const items = list.items ?? [];
  const purchased = items.filter((i) => i.purchased).length;
  const progress = items.length > 0 ? Math.round((purchased / items.length) * 100) : 0;
  const restockItems = items.filter((i) => i.itemType === 'restock');
  const tripItems = items.filter((i) => i.itemType !== 'restock');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <button
          onClick={() => navigate('/provisioning')}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{list.name}</h1>
          {list.description && (
            <p className="text-sm text-gray-500 mt-1">{list.description}</p>
          )}
        </div>
        <select
          value={list.status}
          onChange={(e) =>
            updateList.mutate({
              id: list.id,
              status: e.target.value as ListStatus,
            })
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{list.name}</h1>
        {list.description && <p className="text-sm text-gray-500">{list.description}</p>}
      </div>

      {/* Progress + Actions */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600">
            {purchased} of {items.length} items purchased ({progress}%)
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={handleAddRestockItems}
              disabled={addRestockItems.isPending}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-amber text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <PackagePlus className="h-4 w-4" />
              {addRestockItems.isPending ? 'Adding...' : 'Add Restock Items'}
            </button>
            {allMeals && allMeals.length > 0 && (
              <button
                onClick={() => { setShowMealPicker(!showMealPicker); setMealAddResult(null); }}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  showMealPicker
                    ? 'bg-purple-500 text-white'
                    : 'border border-purple-300 text-purple-600 hover:bg-purple-50'
                }`}
              >
                <UtensilsCrossed className="h-4 w-4" /> Add from Meal
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-ocean text-white hover:bg-ocean-light transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Trip Item
            </button>
          </div>
        </div>
        {addRestockItems.isSuccess && addRestockItems.data?.added === 0 && (
          <div className="text-sm text-gray-500 mb-3">
            All restock items are already on this list (or inventory is fully stocked).
          </div>
        )}
        {addRestockItems.isSuccess && (addRestockItems.data?.added ?? 0) > 0 && (
          <div className="text-sm text-teal mb-3">
            Added {addRestockItems.data?.added} restock item{addRestockItems.data?.added === 1 ? '' : 's'} from inventory shortfalls.
          </div>
        )}
        <div className="w-full bg-sand-dark rounded-full h-3">
          <div
            className="bg-teal rounded-full h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meal Picker */}
      {showMealPicker && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 no-print">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-purple-500" />
            Add missing ingredients from a meal
          </h3>
          {mealAddResult && (
            <div className="text-sm mb-3 px-3 py-2 rounded-lg bg-purple-50 text-purple-700">
              {mealAddResult.added > 0
                ? `Added ${mealAddResult.added} missing ingredient${mealAddResult.added === 1 ? '' : 's'} from "${mealAddResult.mealName}".`
                : `All ingredients from "${mealAddResult.mealName}" are already on this list or in stock.`}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {allMeals?.map((meal) => (
              <button
                key={meal.id}
                onClick={async () => {
                  const result = await addMealItems.mutateAsync({ listId: id!, mealId: meal.id });
                  setMealAddResult(result);
                }}
                disabled={addMealItems.isPending}
                className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                <span className="font-medium text-sm">{meal.name}</span>
                {meal.ingredients && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({meal.ingredients.length} ingredient{meal.ingredients.length === 1 ? '' : 's'})
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowMealPicker(false); setMealAddResult(null); }}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 no-print">
          <form onSubmit={handleAddItem} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value as Category })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-1">Qty</label>
              <input
                type="number"
                min="1"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={newItem.quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Unit</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={addItem.isPending}
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

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No items yet. Add trip items or restock items from your inventory.
          </div>
        ) : (
          <>
            {/* Restock section */}
            {restockItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Restock ({restockItems.length})
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-dark bg-sand/50 text-left text-sm text-gray-600">
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Unit</th>
                      <th className="px-4 py-3 font-medium no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {restockItems.map((item) => renderItemRow(item))}
                  </tbody>
                </table>
              </>
            )}

            {/* Trip section */}
            {tripItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-ocean/5 border-b border-ocean/10">
                  <span className="text-xs font-semibold text-ocean uppercase tracking-wide">
                    Trip Items ({tripItems.length})
                  </span>
                </div>
                <table className="w-full">
                  {restockItems.length === 0 && (
                    <thead>
                      <tr className="border-b border-sand-dark bg-sand/50 text-left text-sm text-gray-600">
                        <th className="px-4 py-3 w-10"></th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                        <th className="px-4 py-3 font-medium">Qty</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Unit</th>
                        <th className="px-4 py-3 font-medium no-print"></th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {tripItems.map((item) => renderItemRow(item))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  function renderItemRow(item: ProvisioningListItem) {

    if (editingItemId === item.id) {
      return (
        <tr key={item.id} className="border-b border-sand-dark/50 bg-blue-50/30">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="min-w-[100px]">
                <label className="block text-xs font-medium mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={editForm.quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium mb-1">Unit</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleSaveEdit}
                  disabled={updateItem.isPending}
                  className="p-1.5 text-white bg-teal rounded hover:bg-teal-light transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingItemId(null)}
                  className="p-1.5 text-gray-500 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr
        key={item.id}
        className={`border-b border-sand-dark/50 transition-colors ${
          item.purchased ? 'bg-green-50/50' : 'hover:bg-sand/30'
        }`}
      >
        <td className="px-4 py-3">
          <button
            onClick={() => {
              if (!item.purchased) {
                purchaseItem.mutate({ listId: id!, itemId: item.id });
              }
            }}
            disabled={item.purchased}
            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
              item.purchased
                ? 'bg-teal border-teal text-white'
                : 'border-gray-300 hover:border-teal'
            }`}
          >
            {item.purchased && <Check className="h-3 w-3" />}
          </button>
        </td>
        <td
          className={`px-4 py-3 font-medium ${
            item.purchased ? 'line-through text-gray-400' : ''
          }`}
        >
          {item.name}
        </td>
        <td className="px-4 py-3 text-sm hidden sm:table-cell">
          {CATEGORIES.find((c) => c.value === item.category)?.label}
        </td>
        <td className="px-4 py-3">{item.quantity}</td>
        <td className="px-4 py-3 text-sm hidden sm:table-cell">{item.unit}</td>
        <td className="px-4 py-3 no-print">
          <div className="flex gap-1">
            {!item.purchased && (
              <button
                onClick={() => startEdit(item)}
                className="p-1 text-gray-400 hover:text-ocean transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() =>
                deleteItem.mutate({ listId: id!, itemId: item.id })
              }
              className="p-1 text-gray-400 hover:text-coral transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
}
