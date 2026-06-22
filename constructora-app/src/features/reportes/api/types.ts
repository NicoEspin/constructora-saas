import type { DocumentPdfType } from '@/features/document-pdf-settings/api/types';
import type { ExpenseStatus } from '@/features/gastos/api/types';
import type { ProjectStageStatus, ProjectStatus } from '@/features/obras/api/types';
import type { BudgetStatus } from '@/features/presupuestos/api/types';

export type ReportDocumentType = Extract<
  DocumentPdfType,
  'PROJECT_OPERATIONAL_REPORT' | 'PROJECT_EXECUTIVE_REPORT'
>;

export interface ReportMessage {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ProjectOperationalReport {
  reportType: 'PROJECT_OPERATIONAL_REPORT';
  generatedAt: string;
  title: string;
  project: {
    id: string;
    tenantId: string;
    name: string;
    status: ProjectStatus;
    clientName: string;
    managerName: string;
    location: string | null;
    startDate: string | null;
    estimatedEndDate: string | null;
    actualEndDate: string | null;
    progressPercent: number;
    adjustedEstimatedEndDate: string | null;
    totalDelayHours: number;
    totalDelayDays: number;
  };
  stageSummary: {
    stagesCount: number;
    completedStagesCount: number;
    inProgressStagesCount: number;
    pendingStagesCount: number;
    blockedStagesCount: number;
  };
  stages: Array<{
    id: string;
    name: string;
    status: ProjectStageStatus;
    progressPercent: number;
    weightPercent: number | null;
    position: number;
    estimatedStartDate: string | null;
    estimatedEndDate: string | null;
    actualStartDate: string | null;
    actualEndDate: string | null;
  }>;
  incidents: Array<{
    id: string;
    incidentDate: string;
    reason: string;
    category: string | null;
    delayDays: number;
    delayHours: number;
    notes: string | null;
  }>;
  alerts: ReportMessage[];
  warnings: ReportMessage[];
}

export interface ProjectExecutiveReport {
  reportType: 'PROJECT_EXECUTIVE_REPORT';
  generatedAt: string;
  title: string;
  project: {
    id: string;
    tenantId: string;
    name: string;
    status: ProjectStatus;
    clientName: string;
    managerName: string;
    location: string | null;
    progressPercent: number;
  };
  financialSnapshot: {
    approvedBudgetAmount: string | null;
    latestBudgetAmount: string | null;
    selectedBudgetStatus: string | null;
    confirmedCollectedAmount: string;
    pendingCollectedAmount: string;
    remainingToCollectAmount: string | null;
    totalRecordedExpenseAmount: string;
    paidExpenseAmount: string;
    pendingExpenseAmount: string;
    overdueExpenseAmount: string;
    realGrossMarginAmount: string;
    projectedGrossMarginAmount: string | null;
    budgetVsExpenseDeviationAmount: string | null;
    budgetVsExpenseDeviationPercent: number | null;
    totalDelayHours: number;
    incidentCount: number;
  };
  budgets: Array<{
    id: string;
    name: string;
    status: BudgetStatus;
    profitAmount: string;
    totalAmount: string | null;
    createdAt: string;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: string;
    status: ExpenseStatus;
    expenseDate: string;
    dueDate: string | null;
    categoryName: string;
    supplierName: string | null;
  }>;
  alerts: ReportMessage[];
  warnings: ReportMessage[];
}
