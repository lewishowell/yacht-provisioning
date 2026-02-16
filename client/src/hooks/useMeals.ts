import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Meal, MealIngredient, Category, IngredientCheck } from '../types';

export function useMeals() {
  return useQuery({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data } = await api.get<Meal[]>('/meals');
      return data;
    },
  });
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: ['meals', id],
    queryFn: async () => {
      const { data } = await api.get<Meal>(`/meals/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      servings?: number;
      ingredients?: { name: string; category: Category; quantity: number; unit: string }[];
    }) => api.post('/meals', data).then((r) => r.data as Meal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useUpdateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      servings?: number;
    }) => api.patch(`/meals/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      ...data
    }: {
      mealId: string;
      name: string;
      category: Category;
      quantity: number;
      unit: string;
    }) =>
      api.post(`/meals/${mealId}/ingredients`, data).then((r) => r.data as MealIngredient),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meals', v.mealId] });
      qc.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      ingredientId,
      ...data
    }: {
      mealId: string;
      ingredientId: string;
      name?: string;
      category?: Category;
      quantity?: number;
      unit?: string;
    }) =>
      api.patch(`/meals/${mealId}/ingredients/${ingredientId}`, data).then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meals', v.mealId] });
      qc.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, ingredientId }: { mealId: string; ingredientId: string }) =>
      api.delete(`/meals/${mealId}/ingredients/${ingredientId}`),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['meals', v.mealId] });
      qc.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useCheckInventory(mealId: string, enabled = false) {
  return useQuery({
    queryKey: ['meals', mealId, 'check-inventory'],
    queryFn: async () => {
      const { data } = await api.get<IngredientCheck[]>(`/meals/${mealId}/check-inventory`);
      return data;
    },
    enabled: !!mealId && enabled,
  });
}
