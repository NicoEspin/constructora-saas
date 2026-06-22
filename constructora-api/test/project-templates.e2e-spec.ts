import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Project templates (e2e)', () => {
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

  async function createClientForTenant(tenantId: string, name: string) {
    return prisma.client.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  it('should create, list, get, update and delete tenant-scoped project templates', async () => {
    const owner = await createUserWithTenant(
      'template-owner@example.com',
      'Tenant One',
      'template-tenant',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/project-templates')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Obra residencial base  ',
        description: '  Secuencia estandar de vivienda  ',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Obra residencial base');
    expect(createResponse.body.description).toBe('Secuencia estandar de vivienda');
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);

    const templateId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/project-templates')
      .query({ search: 'residencial', page: 1, take: 10 })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(templateId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/project-templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: ' Obra residencial premium ',
        description: null,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Obra residencial premium');
    expect(updateResponse.body.description).toBeNull();

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/project-templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project-template' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'project-template.create',
      'project-template.update',
      'project-template.delete',
    ]);
  });

  it('should create, list, get, update and delete project template stages', async () => {
    const owner = await createUserWithTenant(
      'template-stages@example.com',
      'Tenant One',
      'template-stages',
    );
    const template = await prisma.projectTemplate.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Plantilla Etapas',
      },
    });

    const createResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Fundaciones  ',
        description: '  Bases y replanteo  ',
        weightPercent: 35,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Fundaciones');
    expect(createResponse.body.description).toBe('Bases y replanteo');
    expect(createResponse.body.position).toBe(1);
    expect(createResponse.body.weightPercent).toBe(35);

    const stageId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(stageId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${template.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(stageId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/project-templates/${template.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: ' Fundaciones II ',
        weightPercent: 50,
        position: 2,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Fundaciones II');
    expect(updateResponse.body.weightPercent).toBe(50);
    expect(updateResponse.body.position).toBe(2);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/project-templates/${template.id}/stages/${stageId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'project-template-stage' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'project-template-stage.create',
      'project-template-stage.update',
      'project-template-stage.delete',
    ]);
  });

  it('should isolate templates and stages by tenant and template path', async () => {
    const tenantOne = await createUserWithTenant(
      'template-t1@example.com',
      'Tenant One',
      'tmpl-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'template-t2@example.com',
      'Tenant Two',
      'tmpl-t2',
    );
    const template = await prisma.projectTemplate.create({
      data: {
        tenantId: tenantOne.tenant.id,
        name: 'Plantilla Privada',
      },
    });
    const otherTemplate = await prisma.projectTemplate.create({
      data: {
        tenantId: tenantOne.tenant.id,
        name: 'Plantilla Secundaria',
      },
    });
    const stage = await prisma.projectTemplateStage.create({
      data: {
        tenantId: tenantOne.tenant.id,
        projectTemplateId: template.id,
        name: 'Etapa secreta',
        position: 1,
      },
    });

    const foreignListResponse = await request(app.getHttpServer())
      .get('/api/project-templates')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignListResponse.status).toBe(200);
    expect(foreignListResponse.body.items).toHaveLength(0);

    const foreignGetResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${template.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignGetResponse.status).toBe(404);

    const foreignStagesResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignStagesResponse.status).toBe(404);

    const wrongTemplateStageResponse = await request(app.getHttpServer())
      .get(`/api/project-templates/${otherTemplate.id}/stages/${stage.id}`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id);

    expect(wrongTemplateStageResponse.status).toBe(404);
  });

  it('should enforce unique template names and unique stage positions within a template', async () => {
    const owner = await createUserWithTenant(
      'template-rules@example.com',
      'Tenant One',
      'template-rules',
    );
    const template = await prisma.projectTemplate.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Plantilla Reglas',
      },
    });

    const duplicateTemplateResponse = await request(app.getHttpServer())
      .post('/api/project-templates')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Plantilla Reglas' });

    expect(duplicateTemplateResponse.status).toBe(409);
    expect(duplicateTemplateResponse.body.message).toBe('Project template already exists');

    const firstStageResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa 1' });

    expect(firstStageResponse.status).toBe(201);
    expect(firstStageResponse.body.position).toBe(1);

    const secondStageResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa 2' });

    expect(secondStageResponse.status).toBe(201);
    expect(secondStageResponse.body.position).toBe(2);

    const duplicatePositionResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${template.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Etapa duplicada', position: 2 });

    expect(duplicatePositionResponse.status).toBe(400);
    expect(duplicatePositionResponse.body.message).toBe(
      'Stage position is already in use for this project template',
    );

    const updateDuplicatePositionResponse = await request(app.getHttpServer())
      .patch(`/api/project-templates/${template.id}/stages/${firstStageResponse.body.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ position: 2 });

    expect(updateDuplicatePositionResponse.status).toBe(400);
    expect(updateDuplicatePositionResponse.body.message).toBe(
      'Stage position is already in use for this project template',
    );
  });

  it('should keep project stage materialization working from existing templates', async () => {
    const owner = await createUserWithTenant(
      'template-materialization@example.com',
      'Tenant One',
      'template-materialization',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Materializacion');

    const templateCreateResponse = await request(app.getHttpServer())
      .post('/api/project-templates')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Plantilla Materializable' });

    expect(templateCreateResponse.status).toBe(201);
    const templateId = templateCreateResponse.body.id as string;

    const firstStageResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${templateId}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Excavacion', position: 1, weightPercent: 30 });

    expect(firstStageResponse.status).toBe(201);

    const secondStageResponse = await request(app.getHttpServer())
      .post(`/api/project-templates/${templateId}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ name: 'Estructura', position: 2, weightPercent: 70 });

    expect(secondStageResponse.status).toBe(201);

    const createProjectResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: 'Obra materializada',
        clientId: client.id,
        projectTemplateId: templateId,
      });

    expect(createProjectResponse.status).toBe(201);

    const projectStagesResponse = await request(app.getHttpServer())
      .get(`/api/projects/${createProjectResponse.body.id}/stages`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(projectStagesResponse.status).toBe(200);
    expect(projectStagesResponse.body).toHaveLength(2);
    expect(projectStagesResponse.body[0].projectTemplateStageId).toBe(firstStageResponse.body.id);
    expect(projectStagesResponse.body[1].projectTemplateStageId).toBe(secondStageResponse.body.id);
  });
});
