import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Clients (e2e)', () => {
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
    await prisma.$transaction([
      prisma.documentPdfSetting.deleteMany({}),
      prisma.projectTemplateStageTask.deleteMany({}),
      prisma.projectStageTask.deleteMany({}),
      prisma.budgetItem.deleteMany({}),
      prisma.attachment.deleteMany({}),
      prisma.projectIncome.deleteMany({}),
      prisma.projectIncident.deleteMany({}),
      prisma.expense.deleteMany({}),
      prisma.budget.deleteMany({}),
      prisma.projectStage.deleteMany({}),
      prisma.expenseCategory.deleteMany({}),
      prisma.project.deleteMany({}),
      prisma.material.deleteMany({}),
      prisma.projectTemplateStage.deleteMany({}),
      prisma.projectTemplate.deleteMany({}),
      prisma.supplier.deleteMany({}),
      prisma.client.deleteMany({}),
      prisma.refreshToken.deleteMany({}),
      prisma.auditLog.deleteMany({}),
      prisma.membership.deleteMany({}),
      prisma.featureFlag.deleteMany({}),
      prisma.tenant.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);
    await app.close();
  });

  beforeEach(async () => {
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
  });

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

  it('should create, list, get, update and delete tenant-scoped clients', async () => {
    const owner = await createUserWithTenant('owner@example.com', 'Tenant One', 'tenant-one');

    const createResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Acme SA',
        email: 'CONTACTO@ACME.COM',
        phone: ' 1234 ',
        taxId: '30-12345678-9',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Acme SA');
    expect(createResponse.body.email).toBe('contacto@acme.com');
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);

    const clientId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/clients')
      .query({ search: 'acme', page: 1, take: 10 })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(clientId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ notes: 'Cliente prioritario', email: null });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.notes).toBe('Cliente prioritario');
    expect(updateResponse.body.email).toBeNull();

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/clients/${clientId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'client' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'client.create',
      'client.update',
      'client.delete',
    ]);
  });

  it('should not expose clients across tenants', async () => {
    const tenantOne = await createUserWithTenant('user1@example.com', 'Tenant One', 'tenant-one');
    const tenantTwo = await createUserWithTenant('user2@example.com', 'Tenant Two', 'tenant-two');

    const client = await prisma.client.create({
      data: {
        tenantId: tenantOne.tenant.id,
        name: 'Hidden Client',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/clients/${client.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);
  });
});
