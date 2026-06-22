import { queryOptions } from '@tanstack/react-query';
import { getExpenseCategories, getExpenses, getExpensesMonthlySummary } from './service';
import type { ExpenseFilters } from './types';

export const expenseKeys = {
  all: ['expenses'] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...expenseKeys.all, 'detail', id] as const,
  monthlySummary: () => [...expenseKeys.all, 'monthly-summary'] as const,
};

export const expenseCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: expenseKeys.categories(),
    queryFn: () => getExpenseCategories(),
    staleTime: 5 * 60 * 1000,
  });

export const expensesQueryOptions = (filters: ExpenseFilters) =>
  queryOptions({
    queryKey: expenseKeys.list(filters),
    queryFn: () => getExpenses(filters),
  });

export const expenseMonthlySummaryQueryOptions = () =>
  queryOptions({
    queryKey: expenseKeys.monthlySummary(),
    queryFn: () => getExpensesMonthlySummary(),
  });
