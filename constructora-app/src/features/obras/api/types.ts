import type { Attachment } from '@/features/attachments/api/types';
import type { MeasurementUnit } from '@/features/presupuestos/api/types';

export type ProjectStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type ProjectStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'CHECK'
  | 'OTHER';
export type ProjectIncomeStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type ProjectIncidentCategory =
  | 'WEATHER'
  | 'SUPPLIER'
  | 'CLIENT'
  | 'PERMIT'
  | 'MATERIALS'
  | 'WORKFORCE'
  | 'TECHNICAL'
  | 'SAFETY'
  | 'OTHER';

export interface ProjectClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
}

export interface ProjectTemplateRef {
  id: string;
  name: string;
  description: string | null;
}

export interface ProjectManager {
  id: string;
  email: string;
  displayName: string | null;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  status: ProjectStatus;
  progressPercent: number;
  clientId: string | null;
  client: ProjectClient | null;
  projectTemplateId: string | null;
  projectTemplate: ProjectTemplateRef | null;
  managerUserId: string | null;
  manager: ProjectManager | null;
  location: string | null;
  startDate: string | null;
  actualStartDate?: string | null;
  estimatedEndDate: string | null;
  actualEndDate?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  budgets: Array<{
    id: string;
    name: string;
    status: string;
    profitAmount: string;
    totalAmount: string | null;
    createdAt: string;
  }>;
  incomes: ProjectIncome[];
  incidents: ProjectIncident[];
  summary: ProjectFinancialSummary;
}

export interface ProjectIncome {
  id: string;
  projectId: string;
  budgetId?: string | null;
  receivedAt: string;
  amount: string;
  status?: ProjectIncomeStatus;
  description: string | null;
  paymentMethod: PaymentMethod | null;
  reference: string | null;
  notes: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIncident {
  id: string;
  projectId: string;
  projectStageId?: string | null;
  projectStage?: {
    id: string;
    name: string;
    position: number;
    status: ProjectStageStatus;
    projectId: string;
  } | null;
  incidentDate: string;
  reason: string;
  category?: ProjectIncidentCategory | null;
  delayDays: number;
  delayHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAlert {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ProjectWarning {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ProjectFinancialSummary {
  // Legacy fields — preserved for backward compat
  totalCollectedAmount: string;
  totalRecordedExpenseAmount: string;
  realizedGrossMarginAmount: string;
  realizedGrossMarginPercent: number | null;
  estimatedBudgetMarginAmount: string | null;
  estimatedBudgetMarginPercent: number | null;
  estimatedBudgetMarginBudgetName: string | null;
  estimatedBudgetMarginSource: 'latest-approved-budget' | 'latest-budget' | null;
  incidentCount: number;
  totalDelayHours: number;

  // New fields — optional for safe backward compat
  progressPercent?: number;
  confirmedCollectedAmount?: string;
  pendingCollectedAmount?: string;
  cancelledCollectedAmount?: string;
  paidExpenseAmount?: string;
  pendingExpenseAmount?: string;
  overdueExpenseAmount?: string;
  cancelledExpenseAmount?: string;
  approvedBudgetAmount?: string | null;
  latestBudgetAmount?: string | null;
  selectedBudgetId?: string | null;
  selectedBudgetStatus?: string | null;
  remainingToCollectAmount?: string | null;
  realGrossMarginAmount?: string;
  projectedGrossMarginAmount?: string | null;
  budgetVsExpenseDeviationAmount?: string | null;
  budgetVsExpenseDeviationPercent?: number | null;
  totalDelayDays?: number;
  adjustedEstimatedEndDate?: string | null;
  stagesCount?: number;
  completedStagesCount?: number;
  inProgressStagesCount?: number;
  pendingStagesCount?: number;
  blockedStagesCount?: number;
  alerts?: ProjectAlert[];
  warnings?: ProjectWarning[];
}

export interface ProjectsResponse {
  items: Project[];
  page: number;
  take: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProjectFilters {
  page?: number;
  take?: number;
  search?: string;
  status?: ProjectStatus;
  clientId?: string;
}

export interface ProjectMutationPayload {
  name: string;
  status?: ProjectStatus;
  clientId?: string | null;
  managerUserId?: string;
  location?: string;
  startDate?: string;
  actualStartDate?: string | null;
  estimatedEndDate?: string;
  actualEndDate?: string | null;
  notes?: string;
  projectTemplateId?: string | null;
}

export interface ApplyProjectTemplatePayload {
  mode?: 'append';
}

export interface ApplyProjectTemplateResponse {
  project: ProjectDetail;
  createdStagesCount: number;
}

export interface ProjectStageTemplateRef {
  id: string;
  projectTemplateId: string;
  name: string;
  position: number;
  weightPercent: number | null;
}

export interface ProjectStageTask {
  id: string;
  tenantId: string;
  projectStageId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStage {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description: string | null;
  budgetQuantity: string | null;
  budgetUnit: MeasurementUnit;
  status: ProjectStageStatus;
  progressPercent: number;
  weightPercent: number | null;
  position: number;
  managerUserId: string | null;
  manager: ProjectManager | null;
  projectTemplateStageId: string | null;
  projectTemplateStage: ProjectStageTemplateRef | null;
  tasks: ProjectStageTask[];
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageMutationPayload {
  name: string;
  description?: string;
  budgetQuantity?: number;
  budgetUnit?: MeasurementUnit;
  status?: ProjectStageStatus;
  weightPercent?: number;
  position?: number;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  notes?: string;
  tasks?: Array<{
    title: string;
    completed?: boolean;
  }>;
}

export interface ProjectIncomeMutationPayload {
  projectId: string;
  receivedAt?: string;
  amount: number;
  status?: ProjectIncomeStatus;
  budgetId?: string | null;
  description?: string;
  paymentMethod?: PaymentMethod | null;
  reference?: string;
  notes?: string;
}

export interface ProjectIncidentMutationPayload {
  projectId: string;
  incidentDate?: string;
  reason: string;
  category?: ProjectIncidentCategory | null;
  projectStageId?: string | null;
  delayDays?: number;
  delayHours?: number;
  notes?: string;
}

export interface ProjectIncomeMonthlySummary {
  currentMonthTotal: string;
  previousMonthTotal: string;
  percentChange: number | null;
}

export interface ExportProjectBudgetResponse {
  budgetId: string;
  exportedStagesCount: number;
  skippedStagesCount: number;
}
