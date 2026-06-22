import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Expense categories and expenses (e2e)', () => {
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

  async function createProjectForTenant(tenantId: string, name: string) {
    return prisma.project.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createProjectStageForTenant(tenantId: string, projectId: string, name: string) {
    return prisma.projectStage.create({
      data: {
        tenantId,
        projectId,
        name,
        position: 1,
      },
    });
  }

  async function createSupplierForTenant(tenantId: string, name: string) {
    return prisma.supplier.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createExpenseCategoryForTenant(tenantId: string, name: string) {
    return prisma.expenseCategory.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  it('should create, list, update and delete expense categories with audit trail', async () => {
    const owner = await createUserWithTenant(
      'expense-category-owner@example.com',
      'Tenant One',
      'expense-category-tenant',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Materiales  ',
        description: ' Compras de obra ',
        color: '#F97316',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Materiales');
    expect(createResponse.body.description).toBe('Compras de obra');
    expect(createResponse.body.tenantId).toBe(owner.tenant.id);

    const categoryId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/expense-categories')
      .query({ search: 'material' })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(categoryId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/expense-categories/${categoryId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ description: ' Insumos y consumibles ', color: '#FB923C' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.description).toBe('Insumos y consumibles');
    expect(updateResponse.body.color).toBe('#FB923C');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/expense-categories/${categoryId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'expense-category' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'expense-category.create',
      'expense-category.update',
      'expense-category.delete',
    ]);
  });

  it('should create, list, get, update, change status and delete expenses', async () => {
    const owner = await createUserWithTenant(
      'expenses-owner@example.com',
      'Tenant One',
      'expenses-tenant',
    );
    const category = await createExpenseCategoryForTenant(owner.tenant.id, 'Materiales');
    const secondCategory = await createExpenseCategoryForTenant(owner.tenant.id, 'Servicios');
    const project = await createProjectForTenant(owner.tenant.id, 'Edificio Centro');
    const stage = await createProjectStageForTenant(owner.tenant.id, project.id, 'Fundaciones');
    const supplier = await createSupplierForTenant(owner.tenant.id, 'Hormigonera SA');

    const createResponse = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        categoryId: category.id,
        projectStageId: stage.id,
        supplierId: supplier.id,
        amount: 1250.5,
        description: ' Compra de hormigon H21 ',
        paymentMethod: 'BANK_TRANSFER',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.category.id).toBe(category.id);
    expect(createResponse.body.projectId).toBe(project.id);
    expect(createResponse.body.projectStage.id).toBe(stage.id);
    expect(createResponse.body.supplier.id).toBe(supplier.id);
    expect(createResponse.body.createdByUser.id).toBe(owner.user.id);
    expect(Number(createResponse.body.amount)).toBe(1250.5);
    expect(createResponse.body.status).toBe('PENDING');

    const expenseId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/expenses')
      .query({
        search: 'hormigon',
        status: 'PENDING',
        categoryId: category.id,
        projectId: project.id,
      })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.total).toBe(1);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(expenseId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        categoryId: secondCategory.id,
        projectId: project.id,
        projectStageId: stage.id,
        amount: 1999.99,
        description: ' Hormigon y bombeo ',
        paymentMethod: 'CASH',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.category.id).toBe(secondCategory.id);
    expect(Number(updateResponse.body.amount)).toBe(1999.99);
    expect(updateResponse.body.description).toBe('Hormigon y bombeo');
    expect(updateResponse.body.paymentMethod).toBe('CASH');

    const statusResponse = await request(app.getHttpServer())
      .patch(`/api/expenses/${expenseId}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ status: 'PAID' });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe('PAID');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'expense' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'expense.create',
      'expense.update',
      'expense.status',
      'expense.delete',
    ]);
  });

  it('should isolate expense categories and expenses by tenant', async () => {
    const tenantOne = await createUserWithTenant(
      'expenses-tenant-1@example.com',
      'Tenant One',
      'expenses-t1',
    );
    const tenantTwo = await createUserWithTenant(
      'expenses-tenant-2@example.com',
      'Tenant Two',
      'expenses-t2',
    );
    const category = await createExpenseCategoryForTenant(tenantOne.tenant.id, 'Privada');
    const expense = await prisma.expense.create({
      data: {
        tenantId: tenantOne.tenant.id,
        categoryId: category.id,
        createdByUserId: tenantOne.user.id,
        amount: '450.00',
        description: 'Gasto privado',
      },
    });

    const categoriesResponse = await request(app.getHttpServer())
      .get('/api/expense-categories')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(categoriesResponse.status).toBe(200);
    expect(categoriesResponse.body).toHaveLength(0);

    const expensesResponse = await request(app.getHttpServer())
      .get('/api/expenses')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(expensesResponse.status).toBe(200);
    expect(expensesResponse.body.items).toHaveLength(0);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/expenses/${expense.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(getResponse.status).toBe(404);

    const patchCategoryResponse = await request(app.getHttpServer())
      .patch(`/api/expense-categories/${category.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id)
      .send({ description: 'Intento ajeno' });

    expect(patchCategoryResponse.status).toBe(404);

    const deleteExpenseResponse = await request(app.getHttpServer())
      .delete(`/api/expenses/${expense.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(deleteExpenseResponse.status).toBe(404);
  });

  it('should validate category, project and stage references for expenses', async () => {
    const tenantOne = await createUserWithTenant(
      'expenses-ref-1@example.com',
      'Tenant One',
      'expenses-ref-1',
    );
    const tenantTwo = await createUserWithTenant(
      'expenses-ref-2@example.com',
      'Tenant Two',
      'expenses-ref-2',
    );
    const ownCategory = await createExpenseCategoryForTenant(tenantOne.tenant.id, 'Materiales');
    const ownProject = await createProjectForTenant(tenantOne.tenant.id, 'Obra propia');
    const ownStage = await createProjectStageForTenant(
      tenantOne.tenant.id,
      ownProject.id,
      'Etapa propia',
    );
    const foreignCategory = await createExpenseCategoryForTenant(tenantTwo.tenant.id, 'Ajena');
    const foreignProject = await createProjectForTenant(tenantTwo.tenant.id, 'Obra ajena');
    const foreignStage = await createProjectStageForTenant(
      tenantTwo.tenant.id,
      foreignProject.id,
      'Etapa ajena',
    );
    const otherOwnProject = await createProjectForTenant(tenantOne.tenant.id, 'Otra obra');

    const foreignCategoryResponse = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({ categoryId: foreignCategory.id, amount: 100 });

    expect(foreignCategoryResponse.status).toBe(404);
    expect(foreignCategoryResponse.body.message).toBe('Expense category not found');

    const foreignProjectResponse = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({ categoryId: ownCategory.id, projectId: foreignProject.id, amount: 100 });

    expect(foreignProjectResponse.status).toBe(404);
    expect(foreignProjectResponse.body.message).toBe('Project not found');

    const foreignStageResponse = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({ categoryId: ownCategory.id, projectStageId: foreignStage.id, amount: 100 });

    expect(foreignStageResponse.status).toBe(404);
    expect(foreignStageResponse.body.message).toBe('Project stage not found');

    const mismatchedStageResponse = await request(app.getHttpServer())
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        categoryId: ownCategory.id,
        projectId: otherOwnProject.id,
        projectStageId: ownStage.id,
        amount: 100,
      });

    expect(mismatchedStageResponse.status).toBe(400);
    expect(mismatchedStageResponse.body.message).toBe(
      'Project stage does not belong to the provided project',
    );
  });
});
