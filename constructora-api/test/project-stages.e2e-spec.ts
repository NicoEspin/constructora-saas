import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

jest.setTimeout(20000);

const Role = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

describe('Project stages (e2e)', () => {
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
    await prisma.documentPdfSetting.deleteMany({});
    await prisma.projectTemplateStageTask.deleteMany({});
    await prisma.projectStageTask.deleteMany({});
    await prisma.budgetItem.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.projectIncome.deleteMany({});
    await prisma.projectIncident.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.budget.deleteMany({});
    await prisma.projectStage.deleteMany({});
    await prisma.expenseCategory.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.projectTemplateStage.deleteMany({});
    await prisma.projectTemplate.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.featureFlag.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.user.deleteMany({});
  }

  async function createUserWithTenant(email: string, tenantName: string, tenantSlug: string) {
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
        name: unique(tenantName),
        slug: unique(tenantSlug),
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

  async function createMemberForTenant(tenantId: string, email: string) {
    const uniqueEmail = email.replace(
      '@',
      `+${Date.now()}${Math.random().toString(36).slice(2, 6)}@`,
    );
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: { email: uniqueEmail, hashedPassword },
    });

    await prisma.membership.create({
      data: {
        tenantId,
        userId: user.id,
        role: Role.MEMBER,
      },
    });

    return user;
  }

  async function createClientForTenant(tenantId: string, name: string) {
    return prisma.client.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createProjectForTenant(
    tenantId: string,
    name: string,
    options?: { clientId?: string; projectTemplateId?: string | null },
  ) {
    return prisma.project.create({
      data: {
        tenantId,
        clientId: options?.clientId ?? null,
        projectTemplateId: options?.projectTemplateId ?? null,
        name,
      },
    });
  }

  async function createProjectTemplateForTenant(tenantId: string, name: string) {
    return prisma.projectTemplate.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createProjectTemplateStage(
    tenantId: string,
    projectTemplateId: string,
    name: string,
    position: number,
    weightPercent?: number,
    tasks?: string[],
  ) {
    return prisma.projectTemplateStage.create({
      data: {
        tenantId,
        projectTemplateId,
        name,
        position,
        weightPercent: weightPercent ?? null,
        tasks:
          tasks && tasks.length > 0
            ? {
                create: tasks.map((title, index) => ({
                  tenantId,
                  title,
                  position: index + 1,
                })),
              }
            : undefined,
      },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async function createApprovedBudgetForTenant(tenantId: string, clientId: string, name: string) {
    return prisma.budget.create({
      data: {
        tenantId,
        clientId,
        name,
        status: 'APPROVED',
        subtotalAmount: '1000.00',
        totalAmount: '1210.00',
      },
    });
  }

  it('should create, list, get, update and delete project stages with audit trail', async () => {
    const owner = await createUserWithTenant(
      'stages-owner@example.com',
      'Tenant One',
      'stages-tenant',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Etapas');
    const manager = await createMemberForTenant(owner.tenant.id, 'stage-manager@example.com');
    const project = await createProjectForTenant(owner.tenant.id, 'Edificio Centro', {
      clientId: client.id,
    });

    const createResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Fundaciones  ',
        description: ' Bases y replanteo ',
        managerUserId: manager.id,
        weightPercent: 40,
        notes: ' Prioridad alta ',
        tasks: [
          { title: 'Replanteo', completed: true },
          { title: 'Excavar bases', completed: false },
          { title: 'Armar hierro', completed: false },
          { title: 'Hormigonar', completed: false },
          { title: 'Curado', completed: false },
        ],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Fundaciones');
    expect(createResponse.body.description).toBe('Bases y replanteo');
    expect(createResponse.body.position).toBe(1);
    expect(createResponse.body.progressPercent).toBe(20);
    expect(createResponse.body.status).toBe('IN_PROGRESS');
    expect(createResponse.body.manager.id).toBe(manager.id);
    expect(createResponse.body.tasks).toHaveLength(5);

    const stageId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(stageId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(stageId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: ' Fundaciones II ',
        status: 'IN_PROGRESS',
        managerUserId: null,
        notes: ' En ejecucion ',
        tasks: [
          { title: 'Replanteo', completed: true },
          { title: 'Excavar bases', completed: true },
          { title: 'Armar hierro', completed: true },
          { title: 'Hormigonar', completed: false },
          { title: 'Curado', completed: false },
        ],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Fundaciones II');
    expect(updateResponse.body.status).toBe('IN_PROGRESS');
    expect(updateResponse.body.progressPercent).toBe(60);
    expect(updateResponse.body.managerUserId).toBeNull();

    const projectAfterUpdate = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(projectAfterUpdate.status).toBe(200);
    expect(projectAfterUpdate.body.progressPercent).toBe(60);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const projectAfterDelete = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(projectAfterDelete.status).toBe(200);
    expect(projectAfterDelete.body.progressPercent).toBe(0);

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project-stage' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'project-stage.create',
      'project-stage.update',
      'project-stage.delete',
    ]);
  });

  it('should isolate project stages by tenant and by project path', async () => {
    const tenantOne = await createUserWithTenant(
      'stages-tenant1@example.com',
      'Tenant One',
      'stages-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'stages-tenant2@example.com',
      'Tenant Two',
      'stages-t2',
    );
    const client = await createClientForTenant(tenantOne.tenant.id, 'Cliente Oculto');
    const project = await createProjectForTenant(tenantOne.tenant.id, 'Obra Privada', {
      clientId: client.id,
    });
    const otherProject = await createProjectForTenant(tenantOne.tenant.id, 'Obra Secundaria', {
      clientId: client.id,
    });
    const stage = await prisma.projectStage.create({
      data: {
        tenantId: tenantOne.tenant.id,
        projectId: project.id,
        name: 'Etapa secreta',
        position: 1,
      },
    });

    const foreignListResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignListResponse.status).toBe(404);

    const wrongProjectResponse = await request(app.getHttpServer())
      .get(`/api/projects/${otherProject.id}/stages/${stage.id}`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id);

    expect(wrongProjectResponse.status).toBe(404);

    const foreignDeleteResponse = await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}/stages/${stage.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignDeleteResponse.status).toBe(404);
  });

  it('should keep project stages editable after changing the linked project template', async () => {
    const owner = await createUserWithTenant(
      'stages-template-change@example.com',
      'Tenant One',
      'stages-template-change',
    );
    const firstTemplate = await createProjectTemplateForTenant(owner.tenant.id, 'Plantilla Uno');
    const secondTemplate = await createProjectTemplateForTenant(owner.tenant.id, 'Plantilla Dos');
    const templateStage = await createProjectTemplateStage(
      owner.tenant.id,
      firstTemplate.id,
      'Fundaciones',
      1,
    );
    const project = await createProjectForTenant(owner.tenant.id, 'Obra editable', {
      projectTemplateId: firstTemplate.id,
    });
    const stage = await prisma.projectStage.create({
      data: {
        tenantId: owner.tenant.id,
        projectId: project.id,
        projectTemplateStageId: templateStage.id,
        name: 'Fundaciones',
        position: 1,
      },
    });

    const projectUpdate = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ projectTemplateId: secondTemplate.id });

    expect(projectUpdate.status).toBe(200);
    expect(projectUpdate.body.projectTemplate.id).toBe(secondTemplate.id);

    const stageUpdate = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/stages/${stage.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Fundaciones ajustadas',
        tasks: [
          { title: 'Tarea 1', completed: true },
          { title: 'Tarea 2', completed: true },
          { title: 'Tarea 3', completed: false },
          { title: 'Tarea 4', completed: false },
        ],
      });

    expect(stageUpdate.status).toBe(200);
    expect(stageUpdate.body.name).toBe('Fundaciones ajustadas');
    expect(stageUpdate.body.progressPercent).toBe(50);
    expect(stageUpdate.body.status).toBe('IN_PROGRESS');
    expect(stageUpdate.body.projectTemplateStageId).toBe(templateStage.id);
  });

  it('should recalculate project progress using safe fallbacks for inconsistent weights', async () => {
    const owner = await createUserWithTenant(
      'stages-progress@example.com',
      'Tenant One',
      'stages-progress',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Progreso');
    const project = await createProjectForTenant(owner.tenant.id, 'Obra Progreso', {
      clientId: client.id,
    });

    const stageA = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa A',
        weightPercent: 20,
        tasks: [
          { title: 'Tarea A1', completed: true },
          { title: 'Tarea A2', completed: false },
        ],
      });
    const stageB = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa B',
        weightPercent: 80,
        tasks: [{ title: 'Tarea B1', completed: true }],
      });
    const stageC = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Etapa C',
        tasks: [{ title: 'Tarea C1', completed: false }],
      });

    expect(stageA.status).toBe(201);
    expect(stageB.status).toBe(201);
    expect(stageC.status).toBe(201);

    const weightedProject = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(weightedProject.status).toBe(200);
    expect(weightedProject.body.progressPercent).toBe(50);
    expect(
      weightedProject.body.summary.alerts.map((item: { code: string }) => item.code),
    ).toContain('PARTIAL_STAGE_WEIGHTS');

    const removeWeightsA = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/stages/${stageA.body.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ weightPercent: null });
    const removeWeightsB = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/stages/${stageB.body.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ weightPercent: null });

    expect(removeWeightsA.status).toBe(200);
    expect(removeWeightsB.status).toBe(200);

    const simpleAverageProject = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(simpleAverageProject.status).toBe(200);
    expect(simpleAverageProject.body.progressPercent).toBe(50);
  });

  it('should materialize project stages from a project template on project creation and budget conversion', async () => {
    const owner = await createUserWithTenant(
      'stages-template@example.com',
      'Tenant One',
      'stages-template',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Template');
    const template = await createProjectTemplateForTenant(owner.tenant.id, 'Plantilla Vivienda');
    const templateStageOne = await createProjectTemplateStage(
      owner.tenant.id,
      template.id,
      'Excavacion',
      1,
      25,
      ['Replanteo', 'Pozo'],
    );
    const templateStageTwo = await createProjectTemplateStage(
      owner.tenant.id,
      template.id,
      'Estructura',
      2,
      75,
      ['Columnas', 'Vigas'],
    );
    const approvedBudget = await createApprovedBudgetForTenant(
      owner.tenant.id,
      client.id,
      'Presupuesto plantilla',
    );

    const createProjectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Obra con plantilla',
        clientId: client.id,
        projectTemplateId: template.id,
      });

    expect(createProjectResponse.status).toBe(201);

    const createdProjectStages = await request(app.getHttpServer())
      .get(`/api/projects/${createProjectResponse.body.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(createdProjectStages.status).toBe(200);
    expect(createdProjectStages.body).toHaveLength(2);
    expect(createdProjectStages.body.map((stage: { name: string }) => stage.name)).toEqual([
      'Excavacion',
      'Estructura',
    ]);
    expect(createdProjectStages.body[0].projectTemplateStageId).toBe(templateStageOne.id);
    expect(createdProjectStages.body[1].projectTemplateStageId).toBe(templateStageTwo.id);
    expect(createdProjectStages.body[0].tasks.map((task: { title: string }) => task.title)).toEqual(
      ['Replanteo', 'Pozo'],
    );
    expect(createdProjectStages.body[1].tasks.map((task: { title: string }) => task.title)).toEqual(
      ['Columnas', 'Vigas'],
    );

    const convertResponse = await request(app.getHttpServer())
      .post(`/api/projects/from-budget/${approvedBudget.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ projectTemplateId: template.id });

    expect(convertResponse.status).toBe(201);

    const convertedProjectStages = await request(app.getHttpServer())
      .get(`/api/projects/${convertResponse.body.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(convertedProjectStages.status).toBe(200);
    expect(convertedProjectStages.body).toHaveLength(2);
    expect(convertedProjectStages.body[0].projectTemplateStageId).toBe(templateStageOne.id);
    expect(convertedProjectStages.body[1].projectTemplateStageId).toBe(templateStageTwo.id);
    expect(
      convertedProjectStages.body[0].tasks.map((task: { title: string }) => task.title),
    ).toEqual(['Replanteo', 'Pozo']);
    expect(
      convertedProjectStages.body[1].tasks.map((task: { title: string }) => task.title),
    ).toEqual(['Columnas', 'Vigas']);
  });

  it('should export configured project stages into draft labor budget items and allow repeated exports', async () => {
    const owner = await createUserWithTenant(
      'stages-export@example.com',
      'Tenant One',
      'stages-export',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Exportacion');
    const project = await createProjectForTenant(owner.tenant.id, 'Obra Exportable', {
      clientId: client.id,
    });

    const configuredStageResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Albanileria',
        description: 'Muros exteriores',
        budgetQuantity: 25,
        budgetUnit: 'M2',
      });

    expect(configuredStageResponse.status).toBe(201);
    expect(configuredStageResponse.body.tasks).toEqual([]);
    expect(configuredStageResponse.body.budgetQuantity).toBe('25');
    expect(configuredStageResponse.body.budgetUnit).toBe('M2');

    await prisma.projectStage.create({
      data: {
        tenantId: owner.tenant.id,
        projectId: project.id,
        name: 'Etapa legacy',
        position: 2,
        budgetQuantity: null,
      },
    });

    const firstExportResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/export-budget`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(firstExportResponse.status).toBe(201);
    expect(firstExportResponse.body.exportedStagesCount).toBe(1);
    expect(firstExportResponse.body.skippedStagesCount).toBe(1);

    const secondExportResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/export-budget`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(secondExportResponse.status).toBe(201);
    expect(secondExportResponse.body.exportedStagesCount).toBe(1);

    const exportedBudgets = await prisma.budget.findMany({
      where: { tenantId: owner.tenant.id, projectId: project.id },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    expect(exportedBudgets).toHaveLength(2);
    expect(exportedBudgets[0].status).toBe('DRAFT');
    expect(exportedBudgets[0].clientId).toBe(client.id);
    expect(exportedBudgets[0].items).toHaveLength(1);
    expect(exportedBudgets[0].items[0].category).toBe('LABOR');
    expect(exportedBudgets[0].items[0].name).toBe('Albanileria');
    expect(exportedBudgets[0].items[0].description).toBe('Muros exteriores');
    expect(exportedBudgets[0].items[0].quantity.toString()).toBe('25');
    expect(exportedBudgets[0].items[0].unit).toBe('M2');
    expect(exportedBudgets[0].items[0].unitPrice.toString()).toBe('0');
    expect(exportedBudgets[0].items[0].subtotal.toString()).toBe('0');
    expect(exportedBudgets[1].items).toHaveLength(1);

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, action: 'project.export-budget' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs).toHaveLength(2);
  });

  it('should block budget export when the project has no linked client', async () => {
    const owner = await createUserWithTenant(
      'stages-export-no-client@example.com',
      'Tenant One',
      'stages-export-no-client',
    );
    const project = await createProjectForTenant(owner.tenant.id, 'Obra Sin Cliente');

    const response = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/export-budget`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'La obra debe tener un cliente vinculado para exportar un presupuesto',
    );
  });

  it('should reject stage references that are outside the tenant or incompatible with the project template', async () => {
    const tenantOne = await createUserWithTenant(
      'stages-refs-1@example.com',
      'Tenant One',
      'stages-refs-1',
    );
    const tenantTwo = await createUserWithTenant(
      'stages-refs-2@example.com',
      'Tenant Two',
      'stages-refs-2',
    );
    const client = await createClientForTenant(tenantOne.tenant.id, 'Cliente Ref');
    const templateA = await createProjectTemplateForTenant(tenantOne.tenant.id, 'Plantilla A');
    const templateB = await createProjectTemplateForTenant(tenantOne.tenant.id, 'Plantilla B');
    const foreignTemplate = await createProjectTemplateForTenant(
      tenantTwo.tenant.id,
      'Plantilla C',
    );
    const templateStageA = await createProjectTemplateStage(
      tenantOne.tenant.id,
      templateA.id,
      'Etapa A',
      1,
    );
    const templateStageB = await createProjectTemplateStage(
      tenantOne.tenant.id,
      templateB.id,
      'Etapa B',
      1,
    );
    const foreignTemplateStage = await createProjectTemplateStage(
      tenantTwo.tenant.id,
      foreignTemplate.id,
      'Etapa C',
      1,
    );
    const foreignManager = await createMemberForTenant(
      tenantTwo.tenant.id,
      'foreign-stage-manager@example.com',
    );
    const project = await createProjectForTenant(tenantOne.tenant.id, 'Obra Ref', {
      clientId: client.id,
      projectTemplateId: templateA.id,
    });

    const invalidTemplateStageResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Etapa invalida',
        projectTemplateStageId: templateStageB.id,
      });

    expect(invalidTemplateStageResponse.status).toBe(400);
    expect(invalidTemplateStageResponse.body.message).toBe(
      'Project template stage does not belong to the project template',
    );

    const foreignTemplateStageResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Etapa ajena',
        projectTemplateStageId: foreignTemplateStage.id,
      });

    expect(foreignTemplateStageResponse.status).toBe(404);
    expect(foreignTemplateStageResponse.body.message).toBe('Project template stage not found');

    const foreignManagerResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/stages`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Etapa manager ajeno',
        managerUserId: foreignManager.id,
        projectTemplateStageId: templateStageA.id,
      });

    expect(foreignManagerResponse.status).toBe(404);
    expect(foreignManagerResponse.body.message).toBe('Manager user not found');
  });
});
