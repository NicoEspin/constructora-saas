import { apiClient } from '@/lib/api-client';
import type {
  Expense,
  ExpenseCategory,
  ExpenseFilters,
  ExpenseMonthlySummary,
  ExpenseMutationPayload,
  ExpensesResponse,
  CategoryMutationPayload,
} from './types';

// Expense Categories
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return apiClient<ExpenseCategory[]>('/expense-categories');
}

export async function createExpenseCategory(data: CategoryMutationPayload): Promise<ExpenseCategory> {
  return apiClient<ExpenseCategory>('/expense-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExpenseCategory(
  id: string,
  data: Partial<CategoryMutationPayload>,
): Promise<ExpenseCategory> {
  return apiClient<ExpenseCategory>(`/expense-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await apiClient<void>(`/expense-categories/${id}`, { method: 'DELETE' });
}

// Expenses
export async function getExpenses(filters: ExpenseFilters): Promise<ExpensesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.projectId) params.set('projectId', filters.projectId);
  return apiClient<ExpensesResponse>(`/expenses?${params.toString()}`);
}

export async function getExpense(id: string): Promise<Expense> {
  return apiClient<Expense>(`/expenses/${id}`);
}

export async function getExpensesMonthlySummary(): Promise<ExpenseMonthlySummary> {
  return apiClient<ExpenseMonthlySummary>('/expenses/summary/monthly');
}

export async function createExpense(data: ExpenseMutationPayload): Promise<Expense> {
  return apiClient<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExpense(
  id: string,
  data: Partial<ExpenseMutationPayload>,
): Promise<Expense> {
  return apiClient<Expense>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateExpenseStatus(
  id: string,
  status: string,
): Promise<Expense> {
  return apiClient<Expense>(`/expenses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient<void>(`/expenses/${id}`, { method: 'DELETE' });
}
