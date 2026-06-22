import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  updateExpense,
  updateExpenseCategory,
  updateExpenseStatus,
} from './service';
import { expenseKeys } from './queries';
import type { Expense, ExpenseMutationPayload, CategoryMutationPayload, ExpenseStatus, ExpensesResponse } from './types';

export const createExpenseCategoryMutation = mutationOptions({
  mutationFn: (data: CategoryMutationPayload) => createExpenseCategory(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: expenseKeys.categories() });
  },
});

export const updateExpenseCategoryMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<CategoryMutationPayload> }) =>
    updateExpenseCategory(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: expenseKeys.categories() });
  },
});

export const deleteExpenseCategoryMutation = mutationOptions({
  mutationFn: (id: string) => deleteExpenseCategory(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: expenseKeys.categories() });
  },
});

export const createExpenseMutation = mutationOptions({
  mutationFn: (data: ExpenseMutationPayload) => createExpense(data),
  onSuccess: (newExpense: Expense) => {
    getQueryClient().setQueriesData<ExpensesResponse>(
      { queryKey: [...expenseKeys.all, 'list'] },
      (old) => old ? { ...old, items: [newExpense, ...old.items], total: old.total + 1 } : old,
    );
  },
});

export const updateExpenseMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseMutationPayload> }) =>
    updateExpense(id, data),
  onSuccess: (updated: Expense) => {
    getQueryClient().setQueriesData<ExpensesResponse>(
      { queryKey: [...expenseKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((e) => (e.id === updated.id ? updated : e)) }
          : old,
    );
  },
});

export const updateExpenseStatusMutation = mutationOptions({
  mutationFn: ({ id, status }: { id: string; status: ExpenseStatus }) =>
    updateExpenseStatus(id, status),
  onSuccess: (updated: Expense) => {
    getQueryClient().setQueriesData<ExpensesResponse>(
      { queryKey: [...expenseKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((e) => (e.id === updated.id ? updated : e)) }
          : old,
    );
  },
});

export const deleteExpenseMutation = mutationOptions({
  mutationFn: (id: string) => deleteExpense(id),
  onSuccess: (_: void, id: string) => {
    getQueryClient().setQueriesData<ExpensesResponse>(
      { queryKey: [...expenseKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.filter((e) => e.id !== id), total: old.total - 1 }
          : old,
    );
  },
});
