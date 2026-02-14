import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronUp, ChevronDown, Trash2, Edit2, AlertTriangle, Clock, X, ShoppingCart } from 'lucide-react';
import {
  useInventory,
  useLowStock,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useGenerateShoppingList,
} from '../hooks/useInventory';
import type { InventoryItem, Category } from '../types';

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'FOOD', label: 'Food' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'TOILETRIES', label: 'Toiletries' },
  { value: 'DECK_SUPPLIES', label: 'Deck Supplies' },
  { value: 'GALLEY', label: 'Galley' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'bottles', 'cans', 'boxes', 'packs', 'rolls'];

interface ItemFormData {
  name: string;
  category: Category;
  quantity: string;
  targetQuantity: string;
  unit: string;
  expiryDate: string;
  notes: string;
}

const emptyForm: ItemFormData = {
  name: '',
  category: 'FOOD',
  quantity: '',
  targetQuantity: '',
  unit: 'pcs',
  expiryDate: '',
  notes: '',
};

function StockBar({ quantity, target }: { quantity: number; target: number }) {
  if (target <= 0) return <span className="text-xs text-gray-400">No target set</span>;
  const pct = Math.min(100, Math.round((quantity / target) * 100));
  const color = pct >= 100 ? 'bg-teal' : pct >= 50 ? 'bg-amber' : 'bg-coral';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-sand-dark rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function ItemModal({
  item,
  onClose,
}: {
  item: InventoryItem | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ItemFormData>(
    item
      ? {
          name: item.name,
          category: item.category,
          quantity: item.quantity ? String(item.quantity) : '',
          targetQuantity: item.targetQuantity ? String(item.targetQuantity) : '',
          unit: item.unit,
          expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
          notes: item.notes ?? '',
        }
      : emptyForm,
  );

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      quantity: parseFloat(form.quantity) || 0,
      targetQuantity: parseFloat(form.targetQuantity) || 0,
      unit: form.unit,
      expiryDate: form.expiryDate || null,
      notes: form.notes || null,
    };
    if (item) {
      await updateMutation.mutateAsync({ id: item.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4">
              {item ? 'Edit Item' : 'Add Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean focus:border-transparent outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as Category })
                  }
                >
                  {CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">On Hand</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Qty
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                  value={form.targetQuantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      targetQuantity: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-400 mt-1">Ideal fully-stocked amount</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-ocean text-white hover:bg-ocean-light transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : item ? 'Update' : 'Add Item'}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const lowStockFilter = searchParams.get('filter') === 'lowstock';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState<InventoryItem | null | 'new'>(null);

  const inventoryQuery = useInventory({
    page,
    pageSize: 20,
    search,
    category,
    sort,
    order,
  });
  const lowStockQuery = useLowStock();
  const generateShoppingList = useGenerateShoppingList();

  const isLoading = lowStockFilter ? lowStockQuery.isLoading : inventoryQuery.isLoading;
  const data = lowStockFilter
    ? lowStockQuery.data
      ? { data: lowStockQuery.data, totalPages: 1 }
      : undefined
    : inventoryQuery.data;

  const deleteMutation = useDeleteInventoryItem();

  const toggleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sort === field ? (
      order === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )
    ) : null;

  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiryDate) return false;
    const diff = new Date(item.expiryDate).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  const needsRestock = (item: InventoryItem) =>
    item.targetQuantity > 0 && item.quantity < item.targetQuantity;

  const getNeeded = (item: InventoryItem) =>
    item.targetQuantity > 0 ? Math.max(0, Math.round((item.targetQuantity - item.quantity) * 100) / 100) : 0;

  const handleGenerateShoppingList = async () => {
    try {
      const list = await generateShoppingList.mutateAsync(undefined);
      navigate(`/provisioning/${list.id}`);
    } catch {
      // Error will be shown via the mutation state
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleGenerateShoppingList}
            disabled={generateShoppingList.isPending}
            className="flex items-center justify-center gap-2 bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {generateShoppingList.isPending ? 'Creating...' : 'Create Shopping List'}
          </button>
          <button
            onClick={() => setModalItem('new')}
            className="flex items-center justify-center gap-2 bg-ocean text-white px-4 py-2 rounded-lg hover:bg-ocean-light transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Shopping list generation error */}
      {generateShoppingList.isError && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber" />
          <span className="text-sm font-medium text-amber-800">
            All items are fully stocked — nothing to restock!
          </span>
          <button
            onClick={() => generateShoppingList.reset()}
            className="ml-auto p-1 text-amber-600 hover:text-amber-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Low Stock Filter Banner */}
      {lowStockFilter && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber" />
          <span className="text-sm font-medium text-amber-800">Showing items below target only</span>
          <button
            onClick={() => setSearchParams({})}
            className="ml-auto p-1 text-amber-600 hover:text-amber-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean outline-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setCategory(c.value);
              setPage(1);
            }}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              category === c.value
                ? 'bg-ocean text-white'
                : 'bg-white text-navy border border-sand-dark hover:border-ocean'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand-dark bg-sand/50 text-left text-sm text-gray-600">
                  {[
                    { field: 'name', label: 'Name' },
                    { field: 'category', label: 'Category' },
                    { field: 'quantity', label: 'On Hand' },
                    { field: 'targetQuantity', label: 'Target' },
                    { field: '', label: 'Needed' },
                    { field: '', label: 'Stocked' },
                    { field: 'unit', label: 'Unit' },
                    { field: 'expiryDate', label: 'Expiry' },
                    { field: '', label: '' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 font-medium ${col.field ? 'cursor-pointer select-none' : ''}`}
                      onClick={() => col.field && toggleSort(col.field)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((item) => {
                  const needed = getNeeded(item);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-sand-dark/50 transition-colors ${
                        needsRestock(item) ? 'bg-amber-50/30' : 'hover:bg-sand/30'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {CATEGORIES.find((c) => c.value === item.category)?.label}
                      </td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.targetQuantity > 0 ? item.targetQuantity : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {needed > 0 ? (
                          <span className="text-sm font-medium text-coral">{needed}</span>
                        ) : item.targetQuantity > 0 ? (
                          <span className="text-sm text-teal">Full</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StockBar quantity={item.quantity} target={item.targetQuantity} />
                      </td>
                      <td className="px-4 py-3 text-sm">{item.unit}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : '—'}
                        {isExpiringSoon(item) && (
                          <span className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-coral rounded-full">
                            <Clock className="h-3 w-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalItem(item)}
                            className="p-1 text-gray-400 hover:text-ocean transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this item?'))
                                deleteMutation.mutate(item.id);
                            }}
                            className="p-1 text-gray-400 hover:text-coral transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data?.data.map((item) => {
              const needed = getNeeded(item);
              return (
                <div key={item.id} className={`bg-white rounded-xl shadow-sm p-4 ${needsRestock(item) ? 'border-l-4 border-amber' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {CATEGORIES.find((c) => c.value === item.category)?.label}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModalItem(item)}
                        className="p-1 text-gray-400 hover:text-ocean"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete?')) deleteMutation.mutate(item.id);
                        }}
                        className="p-1 text-gray-400 hover:text-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>
                      <span className="text-gray-400 text-xs">On hand:</span> {item.quantity} {item.unit}
                    </span>
                    {item.targetQuantity > 0 && (
                      <span>
                        <span className="text-gray-400 text-xs">Target:</span> {item.targetQuantity} {item.unit}
                      </span>
                    )}
                    {needed > 0 && (
                      <span className="text-coral font-medium">
                        Need {needed}
                      </span>
                    )}
                  </div>
                  <StockBar quantity={item.quantity} target={item.targetQuantity} />
                  {item.expiryDate && (
                    <div className="text-xs text-gray-500 mt-2">
                      Exp: {new Date(item.expiryDate).toLocaleDateString()}
                      {isExpiringSoon(item) && (
                        <span className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-coral rounded-full">
                          <Clock className="h-3 w-3" /> Expiring
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {data?.data.length === 0 && (
              <p className="text-center text-gray-400 py-12">No items found.</p>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalItem !== null && (
        <ItemModal
          item={modalItem === 'new' ? null : modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
}
