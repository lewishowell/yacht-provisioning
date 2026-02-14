import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ClipboardList, Trash2, X } from 'lucide-react';
import { useProvisioningLists, useCreateList, useDeleteList } from '../hooks/useProvisioningLists';
import type { ProvisioningList, ListStatus } from '../types';

const STATUS_COLORS: Record<ListStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-blue-100 text-ocean',
  COMPLETED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-sand-dark text-gray-500',
};

function CreateListModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createMutation = useCreateList();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ name, description: description || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">New Provisioning List</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Galley Restock"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
            />
          </div>
          <div className="flex justify-end gap-3">
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
              {createMutation.isPending ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressBar({ list }: { list: ProvisioningList }) {
  if (!list.items || list.items.length === 0) return null;
  const purchased = list.items.filter((i) => i.purchased).length;
  const pct = Math.round((purchased / list.items.length) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>
          {purchased}/{list.items.length} items
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-sand-dark rounded-full h-2">
        <div
          className="bg-teal rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProvisioningListsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') as ListStatus | null;

  const [showCreate, setShowCreate] = useState(false);
  const { data: allLists, isLoading } = useProvisioningLists();
  const deleteMutation = useDeleteList();

  const lists = statusFilter && allLists
    ? allLists.filter((l) => l.status === statusFilter)
    : allLists;

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
        <h1 className="text-2xl font-bold">Provisioning Lists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-lg hover:bg-ocean-light transition-colors"
        >
          <Plus className="h-4 w-4" /> New List
        </button>
      </div>

      {/* Status Filter Banner */}
      {statusFilter && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[statusFilter]}`}>
            {statusFilter}
          </span>
          <span className="text-sm font-medium text-blue-800">
            Showing {statusFilter.toLowerCase()} lists only
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="ml-auto p-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!lists || lists.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No provisioning lists yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-ocean hover:underline text-sm"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow relative group"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm('Delete this list?')) deleteMutation.mutate(list.id);
                }}
                className="absolute top-3 right-3 p-1 text-gray-300 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link to={`/provisioning/${list.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[list.status]}`}>
                    {list.status}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{list.name}</h3>
                {list.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {list.description}
                  </p>
                )}
                <ProgressBar list={list} />
                <p className="text-xs text-gray-400 mt-3">
                  Created {new Date(list.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateListModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
