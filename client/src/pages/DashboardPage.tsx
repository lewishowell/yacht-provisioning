import { Link } from 'react-router-dom';
import { Package, ClipboardList, UtensilsCrossed, Clock, Target } from 'lucide-react';
import { useDashboardStats } from '../hooks/useProvisioningLists';
import type { DashboardStats, InventoryItem } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Food',
  BEVERAGES: 'Beverages',
  CLEANING: 'Cleaning',
  TOILETRIES: 'Toiletries',
  DECK_SUPPLIES: 'Deck',
  GALLEY: 'Galley',
  SAFETY: 'Safety',
  OTHER: 'Other',
};

function StockBadge({ item }: { item: InventoryItem }) {
  if (item.targetQuantity <= 0) return null;
  const pct = Math.round((item.quantity / item.targetQuantity) * 100);
  if (pct <= 25) return <span className="text-xs px-2 py-0.5 bg-red-100 text-coral rounded-full">Critical</span>;
  if (pct <= 75) return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber rounded-full">Low</span>;
  return null;
}

function StockBar({ quantity, target }: { quantity: number; target: number }) {
  if (target <= 0) return null;
  const pct = Math.min(100, Math.round((quantity / target) * 100));
  const color = pct >= 100 ? 'bg-teal' : pct >= 50 ? 'bg-amber' : 'bg-coral';
  return (
    <div className="flex items-center gap-2 w-24">
      <div className="flex-1 bg-sand-dark rounded-full h-1.5">
        <div className={`${color} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
      </div>
    );
  }

  const defaults: DashboardStats = {
    totalItems: 0,
    inventoryPct: 100,
    lowStockCount: 0,
    itemsNeeded: 0,
    activeLists: 0,
    mealsStocked: 0,
    totalMeals: 0,
    lowStockItems: [],
    expiringSoon: [],
    recentLists: [],
  };
  const s: DashboardStats = { ...defaults, ...stats };

  const pctColor = s.inventoryPct >= 80 ? 'text-teal' : s.inventoryPct >= 50 ? 'text-amber' : 'text-coral';
  const pctBarColor = s.inventoryPct >= 80 ? 'bg-teal' : s.inventoryPct >= 50 ? 'bg-amber' : 'bg-coral';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Inventory Status */}
        <Link to="/inventory" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-ocean rounded-lg p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-2xl font-bold ${pctColor}`}>{s.inventoryPct}%</p>
              <p className="text-sm text-gray-500">Inventory Stocked</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-sand-dark rounded-full h-2">
              <div className={`${pctBarColor} rounded-full h-2 transition-all`} style={{ width: `${s.inventoryPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{s.totalItems} items tracked</p>
          </div>
        </Link>

        {/* Items Needed */}
        <Link to="/inventory?filter=lowstock" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-amber rounded-lg p-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.itemsNeeded}</p>
              <p className="text-sm text-gray-500">Items Needed</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Across {s.lowStockCount} product{s.lowStockCount !== 1 ? 's' : ''} below target</p>
        </Link>

        {/* Meals Stocked */}
        <Link to="/meals" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 rounded-lg p-3">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {s.mealsStocked}<span className="text-base font-normal text-gray-400">/{s.totalMeals}</span>
              </p>
              <p className="text-sm text-gray-500">Meals Ready</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Meals with all ingredients in stock</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Below Target Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Below Target</h2>
            <Link to="/inventory?filter=lowstock" className="text-sm text-ocean hover:underline">View all</Link>
          </div>
          {s.lowStockItems.length === 0 ? (
            <p className="text-gray-400 text-sm">All items fully stocked!</p>
          ) : (
            <div className="space-y-3">
              {s.lowStockItems.slice(0, 5).map((item) => {
                const needed = item.targetQuantity > 0
                  ? Math.max(0, Math.round((item.targetQuantity - item.quantity) * 100) / 100)
                  : 0;
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{CATEGORY_LABELS[item.category]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm">{item.quantity}/{item.targetQuantity} {item.unit}</span>
                        {needed > 0 && (
                          <p className="text-xs text-coral">Need {needed}</p>
                        )}
                      </div>
                      <StockBar quantity={item.quantity} target={item.targetQuantity} />
                      <StockBadge item={item} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Expiring Soon</h2>
            <Link to="/inventory" className="text-sm text-ocean hover:underline">View all</Link>
          </div>
          {s.expiringSoon.length === 0 ? (
            <p className="text-gray-400 text-sm">No items expiring soon.</p>
          ) : (
            <div className="space-y-3">
              {s.expiringSoon.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[item.category]}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Lists — moved to bottom */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-teal" />
              <h2 className="font-semibold text-lg">Recent Provisioning Lists</h2>
              {s.activeLists > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-ocean rounded-full">
                  {s.activeLists} active
                </span>
              )}
            </div>
            <Link to="/provisioning" className="text-sm text-ocean hover:underline">View all</Link>
          </div>
          {s.recentLists.length === 0 ? (
            <p className="text-gray-400 text-sm">No provisioning lists yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.recentLists.slice(0, 3).map((list) => (
                <Link
                  key={list.id}
                  to={`/provisioning/${list.id}`}
                  className="border border-sand-dark rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <p className="font-medium">{list.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{list.status}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
