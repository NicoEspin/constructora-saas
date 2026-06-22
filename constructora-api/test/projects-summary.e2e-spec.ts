import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Projects summary and validations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  function unique(value: string) {
    return `${value}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  async function cleanupDatabase() {
    await prisma.projectIncident.deleteMany({});
    await prisma.projectIncome.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.expenseCategory.deleteMany({});
    await prisma.budgetItem.deleteMany({});
    await prisma.budget.deleteMany({});
    await prisma.projectStage.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.projectTemplateStage.deleteMany({});
    await prisma.projectTemplate.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.documentPdfSetting.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.user.deleteMany({});
  }

  async function createUserWithTenant(email: string) {
    const uniqueEmail = email.replace(
      '@',
      `+${Date.now()}${Math.random().toString(36).slice(2, 6)}@`,
    );
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: { email: uniqueEmail, hashedPassword },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: unique('Tenant'),
        slug: unique('tenant'),
        memberships: { create: { userId: user.id, role: Role.OWNER } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: 'password123' });

    expect(login.status).toBe(200);

    return {
      user,
      tenant,
      token: login.body.accessToken as string,
    };
  }

  async function createProject(owner: { tenant: { id: string } }, name = 'Obra Base') {
    return prisma.project.create({
      data: {
        tenantId: owner.tenant.id,
        name,
      },
    });
  }

  async function createBudget(
    tenantId: string,
    projectId: string,
    status: 'APPROVED' | 'SENT' | 'REJECTED',
    totalAmount: string,
    name: string,
  ) {
    const client = await prisma.client.create({
      data: {
        tenantId,
        name: unique(`Cliente ${name}`),
      },
    });

    return prisma.budget.create({
      data: {
        tenantId,
        clientId: client.id,
        projectId,
        name,
        status,
        subtotalAmount: totalAmount,
        totalAmount,
        profitAmount: '150.00',
      },
    });
  }

  async function createExpenseCategory(tenantId: string, name = 'Materiales') {
    return prisma.expenseCategory.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function getProjectSummary(token: string, tenantId: string, projectId: string) {
    return request(app.getHttpServer())
      .get(`/api/projects/${projectId}/summary`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-ID', tenantId);
  }

  it('should create a project with coherent planned and actual dates', async () => {
    const owner = await createUserWithTenant('projects-valid-dates@example.com');

    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Obra Fechas Validas',
        startDate: '2026-06-01T00:00:00.000Z',
        estimatedEndDate: '2026-09-01T00:00:00.000Z',
        actualStartDate: '2026-06-03T00:00:00.000Z',
        actualEndDate: '2026-08-29T00:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.startDate).toContain('2026-06-01');
    expect(response.body.estimatedEndDate).toContain('2026-09-01');
    expect(response.body.actualStartDate).toContain('2026-06-03');
    expect(response.body.actualEndDate).toContain('2026-08-29');
  });

  it('should reject a project with incoherent dates', async () => {
    const owner = await createUserWithTenant('projects-invalid-dates@example.com');

    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Obra Fechas Invalidas',
        startDate: '2026-10-01T00:00:00.000Z',
        estimatedEndDate: '2026-09-01T00:00:00.000Z',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Project start date must be before or equal to estimated end date',
    );
  });

  it('should create a stage with coherent dates and reject incoherent ones', async () => {
    const owner = await createUserWithTenant('project-stage-dates@example.com');
    const project = await createProject(owner, 'Obra Etapas Fechas');

    const createResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Instalaciones',
        estimatedStartDate: '2026-06-10T00:00:00.000Z',
        estimatedEndDate: '2026-06-20T00:00:00.000Z',
        actualStartDate: '2026-06-11T00:00:00.000Z',
        actualEndDate: '2026-06-18T00:00:00.000Z',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.estimatedStartDate).toContain('2026-06-10');
    expect(createResponse.body.actualEndDate).toContain('2026-06-18');

    const invalidResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa Invalida',
        estimatedStartDate: '2026-07-20T00:00:00.000Z',
        estimatedEndDate: '2026-07-10T00:00:00.000Z',
      });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.message).toBe(
      'Project stage estimated start date must be before or equal to estimated end date',
    );
  });

  it('should calculate simple progress without weights', async () => {
    const owner = await createUserWithTenant('project-simple-progress@example.com');
    const project = await createProject(owner, 'Obra Progreso Simple');

    await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa 1', progressPercent: 50 });
    await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa 2', progressPercent: 100 });

    const summaryResponse = await getProjectSummary(owner.token, owner.tenant.id, project.id);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.progressPercent).toBe(75);
  });

  it('should calculate weighted progress and expose inconsistent weight warnings', async () => {
    const owner = await createUserWithTenant('project-weighted-progress@example.com');
    const weightedProject = await createProject(owner, 'Obra Ponderada');

    await request(app.getHttpServer())
      .post(`/api/projects/${weightedProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa A', progressPercent: 25, weightPercent: 20 });
    await request(app.getHttpServer())
      .post(`/api/projects/${weightedProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa B', progressPercent: 100, weightPercent: 80 });

    const weightedSummary = await getProjectSummary(
      owner.token,
      owner.tenant.id,
      weightedProject.id,
    );

    expect(weightedSummary.status).toBe(200);
    expect(weightedSummary.body.progressPercent).toBe(85);

    const partialWeightsProject = await createProject(owner, 'Obra Pesos Parciales');

    await request(app.getHttpServer())
      .post(`/api/projects/${partialWeightsProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa A', progressPercent: 60, weightPercent: 50 });
    await request(app.getHttpServer())
      .post(`/api/projects/${partialWeightsProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa B', progressPercent: 0 });

    const partialSummary = await getProjectSummary(
      owner.token,
      owner.tenant.id,
      partialWeightsProject.id,
    );

    expect(partialSummary.status).toBe(200);
    expect(partialSummary.body.progressPercent).toBe(30);
    expect(partialSummary.body.alerts.map((item: { code: string }) => item.code)).toContain(
      'PARTIAL_STAGE_WEIGHTS',
    );
    expect(partialSummary.body.warnings.map((item: { code: string }) => item.code)).toContain(
      'INCONSISTENT_WEIGHT_CONFIGURATION',
    );

    const invalidSumProject = await createProject(owner, 'Obra Pesos Invalidos');

    await request(app.getHttpServer())
      .post(`/api/projects/${invalidSumProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa A', progressPercent: 100, weightPercent: 30 });
    await request(app.getHttpServer())
      .post(`/api/projects/${invalidSumProject.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa B', progressPercent: 50, weightPercent: 30 });

    const invalidSumSummary = await getProjectSummary(
      owner.token,
      owner.tenant.id,
      invalidSumProject.id,
    );

    expect(invalidSumSummary.status).toBe(200);
    expect(invalidSumSummary.body.progressPercent).toBe(75);
    expect(invalidSumSummary.body.alerts.map((item: { code: string }) => item.code)).toContain(
      'STAGE_WEIGHTS_SUM_NOT_100',
    );
    expect(invalidSumSummary.body.warnings.map((item: { code: string }) => item.code)).toContain(
      'INCONSISTENT_WEIGHT_CONFIGURATION',
    );
  });

  it('should expose enriched financial summary with incomes, expenses and margins', async () => {
    const owner = await createUserWithTenant('project-financial-summary@example.com');
    const project = await createProject(owner, 'Obra Financiera');
    const approvedBudget = await createBudget(
      owner.tenant.id,
      project.id,
      'APPROVED',
      '1200.00',
      'Presupuesto Aprobado',
    );
    await createBudget(owner.tenant.id, project.id, 'SENT', '1500.00', 'Presupuesto Enviado');
    const category = await createExpenseCategory(owner.tenant.id);

    const confirmedIncome = await request(app.getHttpServer())
      .post('/api/project-incomes')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        budgetId: approvedBudget.id,
        amount: 1000,
        status: 'CONFIRMED',
      });
    const pendingIncome = await request(app.getHttpServer())
      .post('/api/project-incomes')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        amount: 300,
        status: 'PENDING',
      });
    const cancelledIncome = await request(app.getHttpServer())
      .post('/api/project-incomes')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        amount: 200,
        status: 'CANCELLED',
      });

    expect(confirmedIncome.status).toBe(201);
    expect(pendingIncome.status).toBe(201);
    expect(cancelledIncome.status).toBe(201);

    const paidExpense = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ categoryId: category.id, projectId: project.id, amount: 400, status: 'PAID' });
    const overdueExpense = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        categoryId: category.id,
        projectId: project.id,
        amount: 100,
        status: 'PENDING',
        dueDate: '2025-01-01T00:00:00.000Z',
      });
    const pendingExpense = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ categoryId: category.id, projectId: project.id, amount: 250, status: 'PENDING' });
    const cancelledExpense = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ categoryId: category.id, projectId: project.id, amount: 50, status: 'CANCELLED' });

    expect(paidExpense.status).toBe(201);
    expect(overdueExpense.status).toBe(201);
    expect(pendingExpense.status).toBe(201);
    expect(cancelledExpense.status).toBe(201);

    const summaryResponse = await getProjectSummary(owner.token, owner.tenant.id, project.id);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.totalCollectedAmount).toBe('1000');
    expect(summaryResponse.body.confirmedCollectedAmount).toBe('1000');
    expect(summaryResponse.body.pendingCollectedAmount).toBe('300');
    expect(summaryResponse.body.cancelledCollectedAmount).toBe('200');
    expect(summaryResponse.body.totalRecordedExpenseAmount).toBe('750');
    expect(summaryResponse.body.paidExpenseAmount).toBe('400');
    expect(summaryResponse.body.pendingExpenseAmount).toBe('350');
    expect(summaryResponse.body.overdueExpenseAmount).toBe('100');
    expect(summaryResponse.body.cancelledExpenseAmount).toBe('50');
    expect(summaryResponse.body.approvedBudgetAmount).toBe('1200');
    expect(summaryResponse.body.latestBudgetAmount).toBe('1500');
    expect(summaryResponse.body.selectedBudgetId).toBe(approvedBudget.id);
    expect(summaryResponse.body.selectedBudgetStatus).toBe('APPROVED');
    expect(summaryResponse.body.remainingToCollectAmount).toBe('200');
    expect(summaryResponse.body.realGrossMarginAmount).toBe('600');
    expect(summaryResponse.body.projectedGrossMarginAmount).toBe('450');
    expect(summaryResponse.body.budgetVsExpenseDeviationAmount).toBe('-450');
    expect(summaryResponse.body.budgetVsExpenseDeviationPercent).toBe(-37.5);
    expect(summaryResponse.body.alerts.map((item: { code: string }) => item.code)).toContain(
      'OVERDUE_PENDING_EXPENSES',
    );

    const projectResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(projectResponse.status).toBe(200);
    expect(projectResponse.body.summary.selectedBudgetId).toBe(approvedBudget.id);
  });

  it('should adjust the summary timeline with general and stage incidents and reject foreign stage references', async () => {
    const owner = await createUserWithTenant('project-incidents-summary@example.com');
    const foreignOwner = await createUserWithTenant('project-incidents-foreign@example.com');
    const project = await prisma.project.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Obra Cronograma',
        estimatedEndDate: new Date('2026-07-01T00:00:00.000Z'),
      },
    });

    const stageResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa Cronograma',
        estimatedEndDate: '2026-06-20T00:00:00.000Z',
        status: 'IN_PROGRESS',
        progressPercent: 30,
      });

    expect(stageResponse.status).toBe(201);

    const generalIncident = await request(app.getHttpServer())
      .post('/api/project-incidents')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ projectId: project.id, reason: 'Lluvia', category: 'WEATHER', delayDays: 1 });
    const stageIncident = await request(app.getHttpServer())
      .post('/api/project-incidents')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        projectStageId: stageResponse.body.id,
        reason: 'Permiso municipal',
        category: 'PERMIT',
        delayHours: 12,
      });

    expect(generalIncident.status).toBe(201);
    expect(stageIncident.status).toBe(201);
    expect(stageIncident.body.projectStage.id).toBe(stageResponse.body.id);

    const summaryResponse = await getProjectSummary(owner.token, owner.tenant.id, project.id);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.totalDelayHours).toBe(36);
    expect(summaryResponse.body.totalDelayDays).toBe(1.5);
    expect(summaryResponse.body.adjustedEstimatedEndDate).toContain('2026-07-02T12:00:00.000Z');
    expect(summaryResponse.body.alerts.map((item: { code: string }) => item.code)).toContain(
      'ACCUMULATED_INCIDENT_DELAYS',
    );

    const otherProject = await createProject(owner, 'Otra Obra');
    const wrongProjectIncident = await request(app.getHttpServer())
      .post('/api/project-incidents')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: otherProject.id,
        projectStageId: stageResponse.body.id,
        reason: 'Cruce incorrecto',
      });

    expect(wrongProjectIncident.status).toBe(400);
    expect(wrongProjectIncident.body.message).toBe(
      'Project stage does not belong to the provided project',
    );

    const foreignStage = await prisma.projectStage.create({
      data: {
        tenantId: foreignOwner.tenant.id,
        projectId: (await createProject(foreignOwner, 'Obra Ajena')).id,
        name: 'Etapa Ajena',
        position: 1,
      },
    });

    const foreignIncident = await request(app.getHttpServer())
      .post('/api/project-incidents')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        projectStageId: foreignStage.id,
        reason: 'Cruce tenant',
      });

    expect(foreignIncident.status).toBe(404);
    expect(foreignIncident.body.message).toBe('Project stage not found');
  });

  it('should emit summary alerts for missing budgets and negative real margin', async () => {
    const owner = await createUserWithTenant('project-summary-alerts@example.com');
    const project = await prisma.project.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Obra Alertas',
        estimatedEndDate: new Date('2025-01-01T00:00:00.000Z'),
        status: 'ACTIVE',
      },
    });
    const category = await createExpenseCategory(owner.tenant.id);

    await request(app.getHttpServer())
      .post('/api/project-incomes')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ projectId: project.id, amount: 100, status: 'CONFIRMED' });
    await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        categoryId: category.id,
        projectId: project.id,
        amount: 300,
        status: 'PAID',
        dueDate: '2025-01-10T00:00:00.000Z',
      });

    const summaryResponse = await getProjectSummary(owner.token, owner.tenant.id, project.id);
    const alertCodes = summaryResponse.body.alerts.map((item: { code: string }) => item.code);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.realGrossMarginAmount).toBe('-200');
    expect(alertCodes).toContain('PROJECT_WITHOUT_APPROVED_BUDGET');
    expect(alertCodes).toContain('EXPENSES_WITHOUT_BUDGET');
    expect(alertCodes).toContain('INCOMES_WITHOUT_BUDGET');
    expect(alertCodes).toContain('PROJECT_OVERDUE');
    expect(alertCodes).toContain('NEGATIVE_REAL_GROSS_MARGIN');
  });

  it('should warn when stage dates fall outside the project range', async () => {
    const owner = await createUserWithTenant('project-summary-warnings@example.com');
    const projectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Obra Rangos',
        startDate: '2026-06-01T00:00:00.000Z',
        estimatedEndDate: '2026-06-30T00:00:00.000Z',
      });

    expect(projectResponse.status).toBe(201);

    const stageResponse = await request(app.getHttpServer())
      .post(`/api/projects/${projectResponse.body.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa Fuera de Rango',
        estimatedStartDate: '2026-05-20T00:00:00.000Z',
        estimatedEndDate: '2026-06-10T00:00:00.000Z',
      });

    expect(stageResponse.status).toBe(201);

    const summaryResponse = await getProjectSummary(
      owner.token,
      owner.tenant.id,
      projectResponse.body.id,
    );

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.warnings.map((item: { code: string }) => item.code)).toContain(
      'STAGE_DATES_OUTSIDE_PROJECT_RANGE',
    );
  });
});
