import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Download,
  Printer,
  Check,
  Trash2,
} from 'lucide-react';
import {
  useProvisioningList,
  useUpdateList,
  useAddListItem,
  useDeleteListItem,
  usePurchaseItem,
} from '../hooks/useProvisioningLists';
import type { Category, ListStatus } from '../types';

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
  const deleteItem = useDeleteListItem();
  const purchaseItem = usePurchaseItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'FOOD' as Category,
    quantity: 1,
    unit: 'pcs',
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem.mutateAsync({ listId: id!, ...newItem });
    setNewItem({ name: '', category: 'FOOD', quantity: 1, unit: 'pcs' });
    setShowAddForm(false);
  };

  const handleExportCSV = () => {
    if (!list?.items) return;
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Purchased'];
    const rows = list.items.map((item) => [
      item.name,
      item.category,
      String(item.quantity),
      item.unit,
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
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            {purchased} of {items.length} items purchased ({progress}%)
          </div>
          <div className="flex gap-2 no-print">
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
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-ocean text-white hover:bg-ocean-light transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>
        <div className="w-full bg-sand-dark rounded-full h-3">
          <div
            className="bg-teal rounded-full h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

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
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Unit</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ocean outline-none"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
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
            No items yet. Add some items to get started.
          </div>
        ) : (
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
              {items.map((item) => (
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
