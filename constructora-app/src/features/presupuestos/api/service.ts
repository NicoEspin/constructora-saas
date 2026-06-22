import { apiClient } from '@/lib/api-client';
import type {
  Budget,
  BudgetFilters,
  BudgetMutationPayload,
  BudgetsResponse,
  BudgetStatus,
} from './types';

export async function getBudgets(filters: BudgetFilters): Promise<BudgetsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  return apiClient<BudgetsResponse>(`/budgets?${params.toString()}`);
}

export async function getBudget(id: string): Promise<Budget> {
  return apiClient<Budget>(`/budgets/${id}`);
}

export async function createBudget(data: BudgetMutationPayload): Promise<Budget> {
  return apiClient<Budget>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBudget(id: string, data: BudgetMutationPayload): Promise<Budget> {
  return apiClient<Budget>(`/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateBudgetStatus(id: string, status: BudgetStatus): Promise<Budget> {
  return apiClient<Budget>(`/budgets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient<void>(`/budgets/${id}`, { method: 'DELETE' });
}
