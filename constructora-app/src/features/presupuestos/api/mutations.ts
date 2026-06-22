import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createBudget, updateBudget, updateBudgetStatus, deleteBudget } from './service';
import { budgetKeys } from './queries';
import type { Budget, BudgetMutationPayload, BudgetStatus, BudgetsResponse } from './types';

export const createBudgetMutation = mutationOptions({
  mutationFn: (data: BudgetMutationPayload) => createBudget(data),
  onSuccess: (newBudget: Budget) => {
    getQueryClient().setQueryData(budgetKeys.detail(newBudget.id), newBudget);
    getQueryClient().setQueriesData<BudgetsResponse>(
      { queryKey: [...budgetKeys.all, 'list'] },
      (old) => old ? { ...old, items: [newBudget, ...old.items], total: old.total + 1 } : old,
    );
  },
});

export const updateBudgetMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: BudgetMutationPayload }) =>
    updateBudget(id, data),
  onSuccess: (updated: Budget) => {
    getQueryClient().setQueryData(budgetKeys.detail(updated.id), updated);
    getQueryClient().setQueriesData<BudgetsResponse>(
      { queryKey: [...budgetKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((b) => (b.id === updated.id ? updated : b)) }
          : old,
    );
  },
});

export const updateBudgetStatusMutation = mutationOptions({
  mutationFn: ({ id, status }: { id: string; status: BudgetStatus }) =>
    updateBudgetStatus(id, status),
  onSuccess: (updated: Budget) => {
    getQueryClient().setQueryData(budgetKeys.detail(updated.id), updated);
    getQueryClient().setQueriesData<BudgetsResponse>(
      { queryKey: [...budgetKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((b) => (b.id === updated.id ? updated : b)) }
          : old,
    );
  },
});

export const deleteBudgetMutation = mutationOptions({
  mutationFn: (id: string) => deleteBudget(id),
  onSuccess: (_: void, id: string) => {
    getQueryClient().setQueriesData<BudgetsResponse>(
      { queryKey: [...budgetKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.filter((b) => b.id !== id), total: old.total - 1 }
          : old,
    );
  },
});
