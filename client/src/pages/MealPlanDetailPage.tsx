import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import {
  useMealPlan,
  useAddPlannedMeal,
  useRemovePlannedMeal,
  useGenerateProvisioningList,
} from '../hooks/useMealPlans';
import { useMeals } from '../hooks/useMeals';
import type { MealSlot, PlannedMeal } from '../types';

const SLOT_CONFIG: Record<MealSlot, { label: string; icon: typeof Coffee; color: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: 'text-amber-600 bg-amber-50' },
  lunch: { label: 'Lunch', icon: Sun, color: 'text-ocean bg-blue-50' },
  dinner: { label: 'Dinner', icon: Moon, color: 'text-purple-600 bg-purple-50' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function getDaysInRange(start: string, end: string) {
  const days: Date[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = useMealPlan(id!);
  const { data: meals } = useMeals();
  const addPlannedMeal = useAddPlannedMeal();
  const removePlannedMeal = useRemovePlannedMeal();
  const generateList = useGenerateProvisioningList();

  const [addingSlot, setAddingSlot] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [selectedMealId, setSelectedMealId] = useState('');

  const handleAddMeal = async () => {
    if (!addingSlot || !selectedMealId) return;
    await addPlannedMeal.mutateAsync({
      mealPlanId: id!,
      mealId: selectedMealId,
      date: addingSlot.date,
      slot: addingSlot.slot,
    });
    setAddingSlot(null);
    setSelectedMealId('');
  };

  const handleGenerateList = async () => {
    const list = await generateList.mutateAsync(id!);
    navigate(`/provisioning/${list.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Meal plan not found.</p>
        <Link to="/meal-plans" className="text-ocean hover:underline mt-2 inline-block">
          Back to meal plans
        </Link>
      </div>
    );
  }

  const days = getDaysInRange(plan.startDate, plan.endDate);
  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  // Index planned meals by date+slot
  const mealsByDateSlot = new Map<string, PlannedMeal[]>();
  for (const pm of plan.plannedMeals) {
    const dateKey = new Date(pm.date).toISOString().split('T')[0];
    const key = `${dateKey}|${pm.slot}`;
    const arr = mealsByDateSlot.get(key) || [];
    arr.push(pm);
    mealsByDateSlot.set(key, arr);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/meal-plans')}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{plan.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(plan.startDate)} &ndash; {formatDate(plan.endDate)}
          </p>
        </div>
        <button
          onClick={handleGenerateList}
          disabled={generateList.isPending || plan.plannedMeals.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50 text-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {generateList.isPending ? 'Generating...' : 'Generate Shopping List'}
        </button>
      </div>

      {/* No meals library hint */}
      {(!meals || meals.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          You haven&apos;t created any meals yet.{' '}
          <Link to="/meals" className="underline font-medium">
            Create some meals
          </Link>{' '}
          first, then come back to assign them to your plan.
        </div>
      )}

      {/* Day-by-day grid */}
      <div className="space-y-4">
        {days.map((day) => {
          const dateKey = formatDateISO(day);
          return (
            <div key={dateKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-navy text-white font-semibold text-sm">
                {day.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="divide-y divide-sand-dark">
                {slots.map((slot) => {
                  const key = `${dateKey}|${slot}`;
                  const planned = mealsByDateSlot.get(key) || [];
                  const config = SLOT_CONFIG[slot];
                  const SlotIcon = config.icon;

                  return (
                    <div key={slot} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-2 text-sm font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                          <SlotIcon className="h-3.5 w-3.5" />
                          {config.label}
                        </div>
                        <button
                          onClick={() => {
                            setAddingSlot({ date: dateKey, slot });
                            setSelectedMealId(meals?.[0]?.id || '');
                          }}
                          className="text-gray-400 hover:text-ocean transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Adding UI */}
                      {addingSlot?.date === dateKey && addingSlot?.slot === slot && (
                        <div className="flex items-center gap-2 mb-2">
                          <select
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-ocean outline-none"
                            value={selectedMealId}
                            onChange={(e) => setSelectedMealId(e.target.value)}
                          >
                            {meals?.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.ingredients.length} ingredients)
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddMeal}
                            disabled={!selectedMealId || addPlannedMeal.isPending}
                            className="px-3 py-1.5 text-sm rounded-lg bg-teal text-white hover:bg-teal-light disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddingSlot(null)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Planned meals */}
                      {planned.length === 0 && addingSlot?.date !== dateKey && addingSlot?.slot !== slot && (
                        <p className="text-xs text-gray-300 italic">No meal planned</p>
                      )}
                      {planned.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center justify-between py-1 group"
                        >
                          <Link
                            to={`/meals/${pm.meal.id}`}
                            className="flex items-center gap-2 text-sm hover:text-ocean transition-colors"
                          >
                            <UtensilsCrossed className="h-3.5 w-3.5 text-gray-400" />
                            {pm.meal.name}
                          </Link>
                          <button
                            onClick={() =>
                              removePlannedMeal.mutate({
                                mealPlanId: id!,
                                plannedMealId: pm.id,
                              })
                            }
                            className="p-1 text-gray-300 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
