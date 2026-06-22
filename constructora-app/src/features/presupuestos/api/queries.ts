import { queryOptions } from '@tanstack/react-query';
import { getBudget, getBudgets } from './service';
import type { BudgetFilters } from './types';

export const budgetKeys = {
  all: ['budgets'] as const,
  list: (filters: BudgetFilters) => [...budgetKeys.all, 'list', filters] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
};

export const budgetsQueryOptions = (filters: BudgetFilters) =>
  queryOptions({
    queryKey: budgetKeys.list(filters),
    queryFn: () => getBudgets(filters),
  });

export const budgetQueryOptions = (id: string) =>
  queryOptions({
    queryKey: budgetKeys.detail(id),
    queryFn: () => getBudget(id),
  });
