export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type BudgetItemCategory =
  | 'MATERIAL'
  | 'LABOR'
  | 'TOOL'
  | 'EQUIPMENT'
  | 'TRANSPORT'
  | 'OUTSOURCED_SERVICE'
  | 'ADMINISTRATION'
  | 'EXTRA'
  | 'OTHER';
export type MeasurementUnit =
  | 'UNIT'
  | 'M2'
  | 'M3'
  | 'LINEAR_METER'
  | 'KG'
  | 'LITER'
  | 'BAG'
  | 'ROLL'
  | 'HOUR'
  | 'DAY';

export interface BudgetRelation {
  id: string;
  name: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  tenantId: string;
  materialId: string | null;
  category: BudgetItemCategory;
  name: string;
  description: string | null;
  quantity: string;
  unit: MeasurementUnit;
  unitPrice: string;
  subtotal: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  status: BudgetStatus;
  clientId: string;
  client: BudgetRelation & {
    email?: string | null;
    phone?: string | null;
  };
  projectId: string | null;
  project: (BudgetRelation & { status?: string | null }) | null;
  workType: string | null;
  description: string | null;
  issuedAt: string;
  expiresAt: string | null;
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  profitAmount: string;
  totalAmount: string;
  commercialTerms: string | null;
  paymentTerms: string | null;
  estimatedExecutionTime: string | null;
  items?: BudgetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetsResponse {
  items: Budget[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BudgetFilters {
  page?: number;
  take?: number;
  search?: string;
  status?: BudgetStatus;
  clientId?: string;
}

export interface BudgetMutationPayload {
  name?: string;
  clientId?: string;
  projectId?: string | null;
  workType?: string | null;
  description?: string | null;
  issuedAt?: string;
  expiresAt?: string | null;
  discountAmount?: number;
  taxAmount?: number;
  profitAmount?: number;
  commercialTerms?: string | null;
  paymentTerms?: string | null;
  estimatedExecutionTime?: string | null;
  items?: BudgetItemMutationPayload[];
}

export interface BudgetItemMutationPayload {
  category: BudgetItemCategory;
  materialId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit: MeasurementUnit;
  unitPrice: number;
}

export interface BudgetStatusPayload {
  status: BudgetStatus;
}
