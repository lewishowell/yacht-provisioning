import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CalendarDays, Trash2, ChevronRight } from 'lucide-react';
import { useMealPlans, useCreateMealPlan, useDeleteMealPlan } from '../hooks/useMealPlans';
import type { MealPlan } from '../types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const createMutation = useCreateMealPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ name, startDate, endDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">New Meal Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend in Catalina"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanCard({ plan, onDelete }: { plan: MealPlan; onDelete: () => void }) {
  const mealCount = plan.plannedMeals.length;
  const slots = { breakfast: 0, lunch: 0, dinner: 0 };
  plan.plannedMeals.forEach((pm) => {
    if (pm.slot in slots) slots[pm.slot as keyof typeof slots]++;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow relative group">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm('Delete this meal plan?')) onDelete();
        }}
        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <Link to={`/meal-plans/${plan.id}`}>
        <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {formatDate(plan.startDate)} &ndash; {formatDate(plan.endDate)}
        </p>
        {mealCount > 0 ? (
          <div className="flex gap-3 text-xs text-gray-400">
            {slots.breakfast > 0 && <span>{slots.breakfast} breakfast{slots.breakfast !== 1 ? 's' : ''}</span>}
            {slots.lunch > 0 && <span>{slots.lunch} lunch{slots.lunch !== 1 ? 'es' : ''}</span>}
            {slots.dinner > 0 && <span>{slots.dinner} dinner{slots.dinner !== 1 ? 's' : ''}</span>}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No meals assigned yet</p>
        )}
        <div className="flex items-center gap-1 mt-3 text-xs text-ocean">
          View plan <ChevronRight className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

export function MealPlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: plans, isLoading } = useMealPlans();
  const deleteMutation = useDeleteMealPlan();

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
        <h1 className="text-2xl font-bold">Meal Plans</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-lg hover:bg-ocean-light transition-colors"
        >
          <Plus className="h-4 w-4" /> New Plan
        </button>
      </div>

      {!plans || plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No meal plans yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-ocean hover:underline text-sm"
          >
            Create your first meal plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onDelete={() => deleteMutation.mutate(plan.id)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
