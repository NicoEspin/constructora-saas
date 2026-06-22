import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Project incomes and incidents (e2e)', () => {
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
    await prisma.supplier.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.documentPdfSetting.deleteMany({});
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

  async function createProjectForTenant(tenantId: string, name: string) {
    return prisma.project.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  it('should create, list, get, update and delete project incomes for the current tenant', async () => {
    const owner = await createUserWithTenant(
      'project-income-owner@example.com',
      'Tenant One',
      'project-income-tenant',
    );
    const project = await createProjectForTenant(owner.tenant.id, 'Edificio Centro');

    const createResponse = await request(app.getHttpServer())
      .post('/api/project-incomes')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        receivedAt: '2026-06-17T12:00:00.000Z',
        amount: 1500.75,
        description: '  Anticipo inicial  ',
        paymentMethod: 'BANK_TRANSFER',
        reference: '  REC-001  ',
        notes: '  Cobro correspondiente al hito 1  ',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);
    expect(createResponse.body.project.id).toBe(project.id);
    expect(Number(createResponse.body.amount)).toBe(1500.75);
    expect(createResponse.body.description).toBe('Anticipo inicial');
    expect(createResponse.body.reference).toBe('REC-001');
    expect(createResponse.body.notes).toBe('Cobro correspondiente al hito 1');

    const incomeId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/project-incomes')
      .query({ search: 'anticipo', projectId: project.id, page: 1, take: 10 })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);
    expect(listResponse.body.items[0].id).toBe(incomeId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-incomes/${incomeId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(incomeId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/project-incomes/${incomeId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        amount: 1750,
        description: '  Anticipo ajustado  ',
        paymentMethod: 'CASH',
        reference: '  REC-002  ',
        notes: '  Ajuste de anticipo  ',
      });

    expect(updateResponse.status).toBe(200);
    expect(Number(updateResponse.body.amount)).toBe(1750);
    expect(updateResponse.body.description).toBe('Anticipo ajustado');
    expect(updateResponse.body.paymentMethod).toBe('CASH');
    expect(updateResponse.body.reference).toBe('REC-002');
    expect(updateResponse.body.notes).toBe('Ajuste de anticipo');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/project-incomes/${incomeId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const afterDeleteResponse = await request(app.getHttpServer())
      .get(`/api/project-incomes/${incomeId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(afterDeleteResponse.status).toBe(404);
  });

  it('should create, list, get, update and delete project incidents for the current tenant', async () => {
    const owner = await createUserWithTenant(
      'project-incident-owner@example.com',
      'Tenant One',
      'project-incident-tenant',
    );
    const project = await createProjectForTenant(owner.tenant.id, 'Obra Norte');

    const createResponse = await request(app.getHttpServer())
      .post('/api/project-incidents')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        projectId: project.id,
        incidentDate: '2026-06-17T15:00:00.000Z',
        reason: '  Lluvias intensas  ',
        delayDays: 2,
        delayHours: 4,
        notes: '  Se reprogramó el hormigonado  ',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);
    expect(createResponse.body.project.id).toBe(project.id);
    expect(createResponse.body.reason).toBe('Lluvias intensas');
    expect(createResponse.body.delayDays).toBe(2);
    expect(createResponse.body.delayHours).toBe(4);
    expect(createResponse.body.notes).toBe('Se reprogramó el hormigonado');

    const incidentId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/project-incidents')
      .query({ search: 'lluvias', projectId: project.id, page: 1, take: 10 })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);
    expect(listResponse.body.items[0].id).toBe(incidentId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-incidents/${incidentId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(incidentId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/project-incidents/${incidentId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        reason: '  Retraso por tormenta  ',
        delayDays: 3,
        delayHours: 1,
        notes: '  Se replanificó el cronograma  ',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.reason).toBe('Retraso por tormenta');
    expect(updateResponse.body.delayDays).toBe(3);
    expect(updateResponse.body.delayHours).toBe(1);
    expect(updateResponse.body.notes).toBe('Se replanificó el cronograma');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/project-incidents/${incidentId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const afterDeleteResponse = await request(app.getHttpServer())
      .get(`/api/project-incidents/${incidentId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(afterDeleteResponse.status).toBe(404);
  });

  it('should keep project incomes tenant-scoped', async () => {
    const tenantOne = await createUserWithTenant(
      'project-income-tenant-one@example.com',
      'Tenant One',
      'project-income-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'project-income-tenant-two@example.com',
      'Tenant Two',
      'project-income-t2',
    );
    const ownProject = await createProjectForTenant(tenantOne.tenant.id, 'Obra privada');

    const income = await prisma.projectIncome.create({
      data: {
        tenantId: tenantOne.tenant.id,
        projectId: ownProject.id,
        amount: '999.99',
        description: 'Ingreso ajeno',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/project-incomes')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-incomes/${income.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);
  });

  it('should keep project incidents tenant-scoped', async () => {
    const tenantOne = await createUserWithTenant(
      'project-incident-tenant-one@example.com',
      'Tenant One',
      'project-incident-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'project-incident-tenant-two@example.com',
      'Tenant Two',
      'project-incident-t2',
    );
    const ownProject = await createProjectForTenant(tenantOne.tenant.id, 'Obra reservada');

    const incident = await prisma.projectIncident.create({
      data: {
        tenantId: tenantOne.tenant.id,
        projectId: ownProject.id,
        reason: 'Incidente ajeno',
        delayDays: 1,
        delayHours: 2,
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/project-incidents')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-incidents/${incident.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);
  });
});
