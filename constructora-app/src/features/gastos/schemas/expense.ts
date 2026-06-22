import * as z from 'zod';
import type { ExpenseStatus } from '../api/types';

const EXPENSE_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;

export const expenseSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(1, 'La descripción es requerida').max(400),
  amount: z.number({ error: 'El monto es requerido' }).positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  status: z.enum(EXPENSE_STATUSES),
  projectId: z.string().optional().or(z.literal('')),
  supplierId: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(400).optional().or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

export const EXPENSE_STATUS_OPTIONS = EXPENSE_STATUSES.map((s) => ({
  value: s,
  label: EXPENSE_STATUS_LABELS[s],
}));
