import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { MealPlan, MealSlot, ProvisioningList } from '../types';

export function useMealPlans() {
  return useQuery({
    queryKey: ['meal-plans'],
    queryFn: async () => {
      const { data } = await api.get<MealPlan[]>('/meal-plans');
      return data;
    },
  });
}

export function useMealPlan(id: string) {
  return useQuery({
    queryKey: ['meal-plans', id],
    queryFn: async () => {
      const { data } = await api.get<MealPlan>(`/meal-plans/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
      api.post('/meal-plans', data).then((r) => r.data as MealPlan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });
}

export function useUpdateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      startDate?: string;
      endDate?: string;
    }) => api.patch(`/meal-plans/${id}`, data).then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meal-plans', v.id] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

export function useDeleteMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meal-plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });
}

export function useAddPlannedMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealPlanId,
      ...data
    }: {
      mealPlanId: string;
      mealId: string;
      date: string;
      slot: MealSlot;
    }) =>
      api.post(`/meal-plans/${mealPlanId}/meals`, data).then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meal-plans', v.mealPlanId] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

export function useRemovePlannedMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealPlanId,
      plannedMealId,
    }: {
      mealPlanId: string;
      plannedMealId: string;
    }) => api.delete(`/meal-plans/${mealPlanId}/meals/${plannedMealId}`),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meal-plans', v.mealPlanId] });
      qc.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

export function useGenerateProvisioningList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mealPlanId: string) =>
      api.post(`/meal-plans/${mealPlanId}/generate-list`).then((r) => r.data as ProvisioningList),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provisioning-lists'] });
    },
  });
}
