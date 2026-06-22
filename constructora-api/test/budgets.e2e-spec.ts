import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Budgets (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    try {
      await cleanupDatabase();
    } finally {
      await app.close();
    }
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  async function cleanupDatabase() {
    await prisma.attachment.deleteMany({});
    await prisma.budgetItem.deleteMany({});
    await prisma.budget.deleteMany({});
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
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: { email, hashedPassword },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        memberships: { create: { userId: user.id, role: Role.OWNER } },
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' });

    expect(login.status).toBe(200);

    return {
      user,
      tenant,
      token: login.body.accessToken as string,
    };
  }

  async function createClientForTenant(tenantId: string, name: string) {
    return prisma.client.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createProjectForTenant(tenantId: string, clientId: string, name: string) {
    return prisma.project.create({
      data: {
        tenantId,
        clientId,
        name,
      },
    });
  }

  it('should create, list, get, update, change status and delete tenant-scoped budgets', async () => {
    const owner = await createUserWithTenant(
      'budget-owner@example.com',
      'Tenant One',
      'tenant-one',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Construcciones Acme');
    const project = await createProjectForTenant(owner.tenant.id, client.id, 'Obra Centro');

    const createResponse = await request(app.getHttpServer())
      .post('/api/budgets')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Presupuesto Cocina Integral  ',
        clientId: client.id,
        projectId: project.id,
        discountAmount: 10,
        taxAmount: 21,
        profitAmount: 50,
        items: [
          {
            category: 'MATERIAL',
            name: ' Cemento portland ',
            quantity: 10,
            unit: 'BAG',
            unitPrice: 100.5,
          },
          {
            category: 'LABOR',
            name: 'Mano de obra',
            quantity: 2,
            unit: 'DAY',
            unitPrice: 350,
          },
        ],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Presupuesto Cocina Integral');
    expect(Number(createResponse.body.subtotalAmount)).toBe(1705);
    expect(Number(createResponse.body.totalAmount)).toBe(1766);
    expect(createResponse.body.items).toHaveLength(2);
    expect(createResponse.body.items[0].name).toBe('Cemento portland');
    expect(createResponse.body.items[0].position).toBe(1);
    expect(Number(createResponse.body.items[0].subtotal)).toBe(1005);

    const budgetId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/budgets')
      .query({ search: 'construcciones', status: 'DRAFT', clientId: client.id })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(budgetId);
    expect(getResponse.body.client.id).toBe(client.id);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Presupuesto Cocina Ajustado ',
        projectId: null,
        discountAmount: 5,
        taxAmount: 12,
        profitAmount: 15,
        items: [
          {
            category: 'LABOR',
            name: 'Cuadrilla tecnica',
            quantity: 3,
            unit: 'DAY',
            unitPrice: 100,
          },
        ],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Presupuesto Cocina Ajustado');
    expect(updateResponse.body.projectId).toBeNull();
    expect(updateResponse.body.items).toHaveLength(1);
    expect(Number(updateResponse.body.subtotalAmount)).toBe(300);
    expect(Number(updateResponse.body.totalAmount)).toBe(322);

    const statusResponse = await request(app.getHttpServer())
      .patch(`/api/budgets/${budgetId}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ status: 'SENT' });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe('SENT');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'budget' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'budget.create',
      'budget.update',
      'budget.status',
      'budget.delete',
    ]);
  });

  it('should reject invalid status transitions', async () => {
    const owner = await createUserWithTenant(
      'status-owner@example.com',
      'Tenant One',
      'tenant-status',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Status');

    const budget = await prisma.budget.create({
      data: {
        tenantId: owner.tenant.id,
        clientId: client.id,
        name: 'Budget aprobado',
        status: 'APPROVED',
        subtotalAmount: '100.00',
        totalAmount: '100.00',
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/budgets/${budget.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ status: 'DRAFT' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid budget status transition');
  });

  it('should keep budgets isolated by tenant', async () => {
    const tenantOne = await createUserWithTenant(
      'tenant1-budget@example.com',
      'Tenant One',
      'tenant-b1',
    );
    const tenantTwo = await createUserWithTenant(
      'tenant2-budget@example.com',
      'Tenant Two',
      'tenant-b2',
    );
    const client = await createClientForTenant(tenantOne.tenant.id, 'Cliente Oculto');

    const budget = await prisma.budget.create({
      data: {
        tenantId: tenantOne.tenant.id,
        clientId: client.id,
        name: 'Budget oculto',
        subtotalAmount: '500.00',
        totalAmount: '500.00',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/budgets')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/budgets/${budget.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/budgets/${budget.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(deleteResponse.status).toBe(404);
  });

  it('should reject foreign tenant client references on create', async () => {
    const tenantOne = await createUserWithTenant(
      'tenant1-ref@example.com',
      'Tenant One',
      'tenant-ref-1',
    );
    const tenantTwo = await createUserWithTenant(
      'tenant2-ref@example.com',
      'Tenant Two',
      'tenant-ref-2',
    );
    const foreignClient = await createClientForTenant(tenantTwo.tenant.id, 'Cliente Ajeno');

    const response = await request(app.getHttpServer())
      .post('/api/budgets')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Presupuesto invalido',
        clientId: foreignClient.id,
        items: [],
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Client not found');
  });
});
