export type ExpenseStatus = 'PENDING' | 'PAID' | 'CANCELLED';

import type { Attachment } from '@/features/attachments/api/types';

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRelation {
  id: string;
  name: string;
}

export interface ExpenseCreatedBy {
  id: string;
  email: string;
  displayName: string | null;
}

export interface Expense {
  id: string;
  tenantId: string;
  categoryId: string;
  category: ExpenseRelation;
  projectId: string | null;
  project: ExpenseRelation | null;
  projectStageId: string | null;
  projectStage: ExpenseRelation | null;
  supplierId: string | null;
  supplier: ExpenseRelation | null;
  createdByUserId: string;
  createdBy: ExpenseCreatedBy;
  description: string;
  amount: string;
  status: ExpenseStatus;
  expenseDate: string;
  notes: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesResponse {
  items: Expense[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ExpenseFilters {
  page?: number;
  take?: number;
  search?: string;
  status?: ExpenseStatus;
  categoryId?: string;
  projectId?: string;
}

export interface ExpenseMutationPayload {
  categoryId: string;
  description: string;
  amount: number;
  expenseDate?: string;
  status?: ExpenseStatus;
  projectId?: string | null;
  projectStageId?: string | null;
  supplierId?: string | null;
  notes?: string;
}

export interface CategoryMutationPayload {
  name: string;
  description?: string;
}

export interface ExpenseMonthlySummary {
  currentMonthTotal: string;
  previousMonthTotal: string;
  percentChange: number | null;
}
