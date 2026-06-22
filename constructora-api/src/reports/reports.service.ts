import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getProjectOperationalReport(tenantId: string, projectId: string) {
    const project = await this.projectsService.findOne(tenantId, projectId);
    const summary = project.summary;

    return {
      reportType: 'PROJECT_OPERATIONAL_REPORT' as const,
      generatedAt: new Date().toISOString(),
      title: `Reporte operativo · ${project.name}`,
      project: {
        id: project.id,
        tenantId: project.tenantId,
        name: project.name,
        status: project.status,
        clientName: project.client?.name ?? 'Sin cliente asignado',
        managerName: project.manager?.displayName ?? project.manager?.email ?? 'Sin responsable',
        location: project.location,
        startDate: project.startDate,
        estimatedEndDate: project.estimatedEndDate,
        actualEndDate: project.actualEndDate,
        progressPercent: summary.progressPercent ?? project.progressPercent ?? 0,
        adjustedEstimatedEndDate: summary.adjustedEstimatedEndDate ?? null,
        totalDelayHours: summary.totalDelayHours,
        totalDelayDays: summary.totalDelayDays ?? 0,
      },
      stageSummary: {
        stagesCount: summary.stagesCount ?? 0,
        completedStagesCount: summary.completedStagesCount ?? 0,
        inProgressStagesCount: summary.inProgressStagesCount ?? 0,
        pendingStagesCount: summary.pendingStagesCount ?? 0,
        blockedStagesCount: summary.blockedStagesCount ?? 0,
      },
      stages: project.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        status: stage.status,
        progressPercent: stage.progressPercent,
        weightPercent: stage.weightPercent,
        position: stage.position,
        estimatedStartDate: stage.estimatedStartDate,
        estimatedEndDate: stage.estimatedEndDate,
        actualStartDate: stage.actualStartDate,
        actualEndDate: stage.actualEndDate,
      })),
      incidents: project.incidents.map((incident) => ({
        id: incident.id,
        incidentDate: incident.incidentDate,
        reason: incident.reason,
        category: incident.category,
        delayDays: incident.delayDays,
        delayHours: incident.delayHours,
        notes: incident.notes,
      })),
      alerts: summary.alerts ?? [],
      warnings: summary.warnings ?? [],
    };
  }

  async getProjectExecutiveReport(tenantId: string, projectId: string) {
    const [project, recentExpenses] = await Promise.all([
      this.projectsService.findOne(tenantId, projectId),
      this.prisma.expense.findMany({
        where: { tenantId, projectId },
        take: 8,
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          description: true,
          amount: true,
          status: true,
          expenseDate: true,
          dueDate: true,
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
    ]);

    const summary = project.summary;

    return {
      reportType: 'PROJECT_EXECUTIVE_REPORT' as const,
      generatedAt: new Date().toISOString(),
      title: `Reporte ejecutivo · ${project.name}`,
      project: {
        id: project.id,
        tenantId: project.tenantId,
        name: project.name,
        status: project.status,
        clientName: project.client?.name ?? 'Sin cliente asignado',
        managerName: project.manager?.displayName ?? project.manager?.email ?? 'Sin responsable',
        location: project.location,
        progressPercent: summary.progressPercent ?? project.progressPercent ?? 0,
      },
      financialSnapshot: {
        approvedBudgetAmount: summary.approvedBudgetAmount ?? null,
        latestBudgetAmount: summary.latestBudgetAmount ?? null,
        selectedBudgetStatus: summary.selectedBudgetStatus ?? null,
        confirmedCollectedAmount: summary.confirmedCollectedAmount ?? summary.totalCollectedAmount,
        pendingCollectedAmount: summary.pendingCollectedAmount ?? '0',
        remainingToCollectAmount: summary.remainingToCollectAmount ?? null,
        totalRecordedExpenseAmount: summary.totalRecordedExpenseAmount,
        paidExpenseAmount: summary.paidExpenseAmount ?? '0',
        pendingExpenseAmount: summary.pendingExpenseAmount ?? '0',
        overdueExpenseAmount: summary.overdueExpenseAmount ?? '0',
        realGrossMarginAmount: summary.realGrossMarginAmount ?? summary.realizedGrossMarginAmount,
        projectedGrossMarginAmount:
          summary.projectedGrossMarginAmount ?? summary.estimatedBudgetMarginAmount ?? null,
        budgetVsExpenseDeviationAmount: summary.budgetVsExpenseDeviationAmount ?? null,
        budgetVsExpenseDeviationPercent: summary.budgetVsExpenseDeviationPercent ?? null,
        totalDelayHours: summary.totalDelayHours,
        incidentCount: summary.incidentCount,
      },
      budgets: project.budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        status: budget.status,
        profitAmount: budget.profitAmount,
        totalAmount: budget.totalAmount,
        createdAt: budget.createdAt,
      })),
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        description: expense.description ?? 'Gasto sin descripción',
        amount: expense.amount,
        status: expense.status,
        expenseDate: expense.expenseDate,
        dueDate: expense.dueDate,
        categoryName: expense.category.name,
        supplierName: expense.supplier?.name ?? null,
      })),
      alerts: summary.alerts ?? [],
      warnings: summary.warnings ?? [],
    };
  }
}
