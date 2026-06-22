import * as z from 'zod';
import type { BudgetItemCategory, BudgetStatus, MeasurementUnit } from '../api/types';

const BUDGET_STATUSES = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;
const BUDGET_ITEM_CATEGORIES = [
  'MATERIAL',
  'LABOR',
  'TOOL',
  'EQUIPMENT',
  'TRANSPORT',
  'OUTSOURCED_SERVICE',
  'ADMINISTRATION',
  'EXTRA',
  'OTHER',
] as const;
const MEASUREMENT_UNITS = [
  'UNIT',
  'M2',
  'M3',
  'LINEAR_METER',
  'KG',
  'LITER',
  'BAG',
  'ROLL',
  'HOUR',
  'DAY',
] as const;

export const budgetItemSchema = z.object({
  category: z.enum(BUDGET_ITEM_CATEGORIES),
  materialId: z.string().optional().or(z.literal('')),
  name: z.string().min(1, 'El nombre del item es requerido').max(160),
  description: z.string().max(500).optional().or(z.literal('')),
  quantity: z.number({ error: 'La cantidad es requerida' }).positive('La cantidad debe ser mayor a 0'),
  unit: z.enum(MEASUREMENT_UNITS),
  unitPrice: z.number({ error: 'El precio unitario es requerido' }).min(0, 'El precio no puede ser negativo'),
});

export const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(160),
  clientId: z.string().min(1, 'El cliente es requerido'),
  projectId: z.string().optional().or(z.literal('')),
  workType: z.string().max(120).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
  commercialTerms: z.string().max(2000).optional().or(z.literal('')),
  paymentTerms: z.string().max(2000).optional().or(z.literal('')),
  estimatedExecutionTime: z.string().max(255).optional().or(z.literal('')),
  items: z.array(budgetItemSchema).min(1, 'Agregá al menos un item al presupuesto'),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  EXPIRED: 'Vencido',
};

export const BUDGET_STATUS_OPTIONS = BUDGET_STATUSES.map((s) => ({
  value: s,
  label: BUDGET_STATUS_LABELS[s],
}));

export const BUDGET_ITEM_CATEGORY_LABELS: Record<BudgetItemCategory, string> = {
  MATERIAL: 'Material',
  LABOR: 'Mano de obra',
  TOOL: 'Herramienta',
  EQUIPMENT: 'Equipo',
  TRANSPORT: 'Transporte',
  OUTSOURCED_SERVICE: 'Servicio tercerizado',
  ADMINISTRATION: 'Administración',
  EXTRA: 'Extra',
  OTHER: 'Otro',
};

export const BUDGET_ITEM_CATEGORY_OPTIONS = BUDGET_ITEM_CATEGORIES.map((value) => ({
  value,
  label: BUDGET_ITEM_CATEGORY_LABELS[value],
}));

export const MEASUREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  UNIT: 'Unidad',
  M2: 'm2',
  M3: 'm3',
  LINEAR_METER: 'Metro lineal',
  KG: 'Kg',
  LITER: 'Litro',
  BAG: 'Bolsa',
  ROLL: 'Rollo',
  HOUR: 'Hora',
  DAY: 'Día',
};

export const MEASUREMENT_UNIT_OPTIONS = MEASUREMENT_UNITS.map((value) => ({
  value,
  label: MEASUREMENT_UNIT_LABELS[value],
}));
