import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

describe('Projects (e2e)', () => {
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
    await app.close();
  });

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
  ) {
    return prisma.projectTemplateStage.create({
      data: {
        tenantId,
        projectTemplateId,
        name,
        position,
      },
    });
  }

  it('should create, list, get, update and delete tenant-scoped projects', async () => {
    const owner = await createUserWithTenant(
      'projects-owner@example.com',
      'Tenant One',
      'proj-tenant',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Centro');
    const manager = await createMemberForTenant(owner.tenant.id, 'manager@example.com');

    const createResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Torre Norte  ',
        clientId: client.id,
        managerUserId: manager.id,
        location: ' Av. Central 123 ',
        status: 'ACTIVE',
        notes: ' Inicio inmediato ',
        progressPercent: 88,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Torre Norte');
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);
    expect(createResponse.body.progressPercent).toBe(0);
    expect(createResponse.body.client.id).toBe(client.id);
    expect(createResponse.body.manager.id).toBe(manager.id);

    const projectId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/projects')
      .query({ search: 'cliente', status: 'ACTIVE', clientId: client.id, page: 1, take: 10 })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(projectId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: ' Torre Norte II ',
        status: 'PAUSED',
        managerUserId: null,
        notes: ' En espera ',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Torre Norte II');
    expect(updateResponse.body.status).toBe('PAUSED');
    expect(updateResponse.body.managerId).toBeUndefined();
    expect(updateResponse.body.managerUserId).toBeNull();

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'project.create',
      'project.update',
      'project.delete',
    ]);
  });

  it('should not expose projects across tenants', async () => {
    const tenantOne = await createUserWithTenant(
      'projects-user-1@example.com',
      'Tenant One',
      'proj-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'projects-user-2@example.com',
      'Tenant Two',
      'proj-t2',
    );
    const client = await createClientForTenant(tenantOne.tenant.id, 'Cliente Oculto');

    const project = await prisma.project.create({
      data: {
        tenantId: tenantOne.tenant.id,
        clientId: client.id,
        name: 'Obra oculta',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(deleteResponse.status).toBe(404);
  });

  it('should reject foreign tenant references on create and update', async () => {
    const tenantOne = await createUserWithTenant(
      'projects-ref-1@example.com',
      'Tenant One',
      'proj-ref-1',
    );
    const tenantTwo = await createUserWithTenant(
      'projects-ref-2@example.com',
      'Tenant Two',
      'proj-ref-2',
    );
    const ownClient = await createClientForTenant(tenantOne.tenant.id, 'Cliente propio');
    const foreignClient = await createClientForTenant(tenantTwo.tenant.id, 'Cliente ajeno');
    const foreignManager = await createMemberForTenant(
      tenantTwo.tenant.id,
      'foreign-manager@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Obra invalida',
        clientId: foreignClient.id,
      });

    expect(createResponse.status).toBe(404);
    expect(createResponse.body.message).toBe('Client not found');

    const project = await prisma.project.create({
      data: {
        tenantId: tenantOne.tenant.id,
        clientId: ownClient.id,
        name: 'Obra valida',
      },
    });

    const updateManagerResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({ managerUserId: foreignManager.id });

    expect(updateManagerResponse.status).toBe(404);
    expect(updateManagerResponse.body.message).toBe('Manager user not found');
  });

  it('should convert an approved budget into a project', async () => {
    const owner = await createUserWithTenant(
      'projects-convert@example.com',
      'Tenant One',
      'proj-convert',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Conversion');
    const budget = await createApprovedBudgetForTenant(
      owner.tenant.id,
      client.id,
      'Presupuesto Casa Lago',
    );

    const response = await request(app.getHttpServer())
      .post(`/api/projects/from-budget/${budget.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.clientId).toBe(client.id);
    expect(Number(response.body.assignedBudget)).toBe(1210);
    expect(response.body.name).toBe('Presupuesto Casa Lago');

    const convertedBudget = await prisma.budget.findUniqueOrThrow({ where: { id: budget.id } });
    expect(convertedBudget.projectId).toBe(response.body.id);

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual(['project.convert']);
  });

  it('should append linked template stages to an existing project explicitly', async () => {
    const owner = await createUserWithTenant(
      'projects-apply-template@example.com',
      'Tenant One',
      'proj-apply-template',
    );
    const template = await createProjectTemplateForTenant(owner.tenant.id, 'Plantilla Base');
    await createProjectTemplateStage(owner.tenant.id, template.id, 'Demolicion', 1);
    await createProjectTemplateStage(owner.tenant.id, template.id, 'Terminaciones', 2);

    const project = await prisma.project.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Obra con etapas propias',
        projectTemplateId: template.id,
        stages: {
          create: {
            tenantId: owner.tenant.id,
            name: 'Replanteo',
            position: 1,
          },
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/apply-template`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ mode: 'append' });

    expect(response.status).toBe(201);
    expect(response.body.createdStagesCount).toBe(2);
    expect(response.body.project.projectTemplate.id).toBe(template.id);

    const stages = await prisma.projectStage.findMany({
      where: { tenantId: owner.tenant.id, projectId: project.id },
      orderBy: { position: 'asc' },
    });

    expect(stages.map((stage) => stage.name)).toEqual(['Replanteo', 'Demolicion', 'Terminaciones']);
    expect(stages.map((stage) => stage.position)).toEqual([1, 2, 3]);

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual(['project.template-apply']);
  });

  it('should reject conversion when budget is not approved', async () => {
    const owner = await createUserWithTenant(
      'projects-convert-reject@example.com',
      'Tenant One',
      'proj-convert-reject',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Pendiente');
    const budget = await prisma.budget.create({
      data: {
        tenantId: owner.tenant.id,
        clientId: client.id,
        name: 'Presupuesto pendiente',
        status: 'SENT',
        subtotalAmount: '1000.00',
        totalAmount: '1000.00',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/projects/from-budget/${budget.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Only approved budgets can be converted into projects');
  });

  it('should reject conversion when budget is already linked to a project', async () => {
    const owner = await createUserWithTenant(
      'projects-convert-linked@example.com',
      'Tenant One',
      'proj-convert-linked',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Vinculado');
    const budget = await createApprovedBudgetForTenant(
      owner.tenant.id,
      client.id,
      'Presupuesto vinculado',
    );
    const project = await prisma.project.create({
      data: {
        tenantId: owner.tenant.id,
        clientId: client.id,
        name: 'Obra existente',
      },
    });

    await prisma.budget.update({
      where: { id: budget.id },
      data: { projectId: project.id },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/projects/from-budget/${budget.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Budget is already linked to a project');
  });
});
