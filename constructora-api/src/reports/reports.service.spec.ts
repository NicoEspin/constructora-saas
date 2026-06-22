import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  function createService() {
    const prisma = {
      expense: {
        findMany: jest.fn(),
      },
    } as any;

    const projectsService = {
      findOne: jest.fn(),
    } as any;

    return {
      service: new ReportsService(prisma, projectsService),
      prisma,
      projectsService,
    };
  }

  it('builds the operational report from the project summary', async () => {
    const { service, projectsService } = createService();

    projectsService.findOne.mockResolvedValue({
      id: 'project-1',
      tenantId: 'tenant-1',
      name: 'Obra Centro',
      status: 'ACTIVE',
      location: 'Rosario',
      startDate: '2026-06-01T00:00:00.000Z',
      estimatedEndDate: '2026-07-01T00:00:00.000Z',
      actualEndDate: null,
      progressPercent: 55,
      client: { name: 'Cliente SA' },
      manager: { displayName: 'Ana' },
      stages: [
        {
          id: 'stage-1',
          name: 'Excavacion',
          status: 'IN_PROGRESS',
          progressPercent: 70,
          weightPercent: 30,
          position: 1,
          estimatedStartDate: '2026-06-01T00:00:00.000Z',
          estimatedEndDate: '2026-06-05T00:00:00.000Z',
          actualStartDate: '2026-06-01T00:00:00.000Z',
          actualEndDate: null,
        },
      ],
      incidents: [
        {
          id: 'incident-1',
          incidentDate: '2026-06-03T00:00:00.000Z',
          reason: 'Lluvia',
          category: 'WEATHER',
          delayDays: 1,
          delayHours: 4,
          notes: 'Se reprograma hormigonado',
        },
      ],
      summary: {
        progressPercent: 61,
        adjustedEstimatedEndDate: '2026-07-04T00:00:00.000Z',
        totalDelayHours: 28,
        totalDelayDays: 1,
        stagesCount: 4,
        completedStagesCount: 1,
        inProgressStagesCount: 2,
        pendingStagesCount: 1,
        blockedStagesCount: 0,
        alerts: [{ code: 'late-stage', message: 'Hay una etapa demorada' }],
        warnings: [{ code: 'weather', message: 'Clima inestable' }],
      },
    });

    const result = await service.getProjectOperationalReport('tenant-1', 'project-1');

    expect(result.reportType).toBe('PROJECT_OPERATIONAL_REPORT');
    expect(result.project.progressPercent).toBe(61);
    expect(result.stageSummary.completedStagesCount).toBe(1);
    expect(result.stages).toHaveLength(1);
    expect(result.incidents[0].reason).toBe('Lluvia');
    expect(result.alerts[0].message).toBe('Hay una etapa demorada');
  });

  it('builds the executive report including recent expenses', async () => {
    const { service, projectsService, prisma } = createService();

    projectsService.findOne.mockResolvedValue({
      id: 'project-1',
      tenantId: 'tenant-1',
      name: 'Obra Centro',
      status: 'ACTIVE',
      location: 'Rosario',
      progressPercent: 55,
      client: { name: 'Cliente SA' },
      manager: { email: 'ana@obra.test', displayName: null },
      budgets: [
        {
          id: 'budget-1',
          name: 'Presupuesto Junio',
          status: 'APPROVED',
          profitAmount: '250000.00',
          totalAmount: '1250000.00',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
      summary: {
        approvedBudgetAmount: '1250000.00',
        latestBudgetAmount: '1300000.00',
        selectedBudgetStatus: 'APPROVED',
        confirmedCollectedAmount: '900000.00',
        pendingCollectedAmount: '100000.00',
        remainingToCollectAmount: '250000.00',
        totalRecordedExpenseAmount: '450000.00',
        paidExpenseAmount: '400000.00',
        pendingExpenseAmount: '50000.00',
        overdueExpenseAmount: '10000.00',
        realGrossMarginAmount: '450000.00',
        projectedGrossMarginAmount: '520000.00',
        budgetVsExpenseDeviationAmount: '15000.00',
        budgetVsExpenseDeviationPercent: 3.2,
        totalDelayHours: 12,
        incidentCount: 2,
        alerts: [{ code: 'margin', message: 'Margen en seguimiento' }],
        warnings: [{ code: 'expenses', message: 'Hay gastos pendientes' }],
      },
    });
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'expense-1',
        description: 'Hormigon',
        amount: '120000.00',
        status: 'PAID',
        expenseDate: '2026-06-05T00:00:00.000Z',
        dueDate: null,
        category: { id: 'cat-1', name: 'Materiales' },
        supplier: { id: 'sup-1', name: 'Proveedor SA' },
      },
    ]);

    const result = await service.getProjectExecutiveReport('tenant-1', 'project-1');

    expect(result.reportType).toBe('PROJECT_EXECUTIVE_REPORT');
    expect(result.project.managerName).toBe('ana@obra.test');
    expect(result.financialSnapshot.confirmedCollectedAmount).toBe('900000.00');
    expect(result.budgets[0].status).toBe('APPROVED');
    expect(result.recentExpenses[0].categoryName).toBe('Materiales');
    expect(result.warnings[0].message).toBe('Hay gastos pendientes');
  });
});
