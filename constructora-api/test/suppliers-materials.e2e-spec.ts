import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MeasurementUnit } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

const Role = {
  OWNER: 'OWNER',
} as const;

describe('Suppliers and materials (e2e)', () => {
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

  async function createExpenseCategoryForTenant(tenantId: string, name: string) {
    return prisma.expenseCategory.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  async function createClientForTenant(tenantId: string, name: string) {
    return prisma.client.create({
      data: {
        tenantId,
        name,
      },
    });
  }

  it('should create, list, get, update and delete suppliers with audit trail', async () => {
    const owner = await createUserWithTenant(
      'suppliers-owner@example.com',
      'Tenant One',
      'suppliers-owner',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Hormigonera SA  ',
        trade: '  Hormigon elaborado  ',
        email: 'VENTAS@HORMIGONERA.COM',
        phone: ' 1234 ',
        offerings: '  Hormigon y bombeo ',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Hormigonera SA');
    expect(createResponse.body.trade).toBe('Hormigon elaborado');
    expect(createResponse.body.email).toBe('ventas@hormigonera.com');
    expect(createResponse.body.phone).toBe('1234');

    const supplierId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/suppliers')
      .query({ search: 'hormigon' })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(supplierId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(supplierId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ notes: '  Entrega en 24hs  ', offerings: '   ' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.notes).toBe('Entrega en 24hs');
    expect(updateResponse.body.offerings).toBeNull();

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'supplier' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'supplier.create',
      'supplier.update',
      'supplier.delete',
    ]);
  });

  it('should create, list, get, update and delete materials with price normalization and audit trail', async () => {
    const owner = await createUserWithTenant(
      'materials-owner@example.com',
      'Tenant One',
      'materials-owner',
    );
    const supplier = await prisma.supplier.create({
      data: { tenantId: owner.tenant.id, name: 'Corralon Norte' },
    });

    const createResponse = await request(app.getHttpServer())
      .post('/api/materials')
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({
        name: '  Cemento Portland  ',
        category: '  Construccion  ',
        unit: MeasurementUnit.BAG,
        supplierId: supplier.id,
        estimatedUnitPrice: 12500.5,
        notes: '  Bolsa de 50kg  ',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Cemento Portland');
    expect(createResponse.body.category).toBe('Construccion');
    expect(Number(createResponse.body.estimatedUnitPrice)).toBe(12500.5);
    expect(createResponse.body.lastPriceUpdatedAt).toBeTruthy();
    expect(createResponse.body.supplier.id).toBe(supplier.id);

    const materialId = createResponse.body.id as string;
    const firstPriceUpdatedAt = createResponse.body.lastPriceUpdatedAt as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/materials')
      .query({ search: 'cemento', supplierId: supplier.id })
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(materialId);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(materialId);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id)
      .send({ estimatedUnitPrice: 14000, notes: '   ', supplierId: null });

    expect(updateResponse.status).toBe(200);
    expect(Number(updateResponse.body.estimatedUnitPrice)).toBe(14000);
    expect(updateResponse.body.notes).toBeNull();
    expect(updateResponse.body.supplier).toBeNull();
    expect(updateResponse.body.lastPriceUpdatedAt).toBeTruthy();
    expect(updateResponse.body.lastPriceUpdatedAt).not.toBe(firstPriceUpdatedAt);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true });

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId: owner.tenant.id, entity: 'material' },
      orderBy: { createdAt: 'asc' },
    });

    expect(auditLogs.map((entry) => entry.action)).toEqual([
      'material.create',
      'material.update',
      'material.delete',
    ]);
  });

  it('should isolate suppliers and materials by tenant', async () => {
    const tenantOne = await createUserWithTenant(
      'suppliers-materials-tenant-1@example.com',
      'Tenant One',
      'suppliers-materials-1',
    );
    const tenantTwo = await createUserWithTenant(
      'suppliers-materials-tenant-2@example.com',
      'Tenant Two',
      'suppliers-materials-2',
    );

    const supplier = await prisma.supplier.create({
      data: { tenantId: tenantOne.tenant.id, name: 'Proveedor Privado' },
    });
    const material = await prisma.material.create({
      data: {
        tenantId: tenantOne.tenant.id,
        supplierId: supplier.id,
        name: 'Material Privado',
        unit: MeasurementUnit.UNIT,
      },
    });

    const suppliersResponse = await request(app.getHttpServer())
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(suppliersResponse.status).toBe(200);
    expect(suppliersResponse.body.items).toHaveLength(0);

    const materialsResponse = await request(app.getHttpServer())
      .get('/api/materials')
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(materialsResponse.status).toBe(200);
    expect(materialsResponse.body.items).toHaveLength(0);

    const foreignSupplierResponse = await request(app.getHttpServer())
      .get(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignSupplierResponse.status).toBe(404);

    const foreignMaterialResponse = await request(app.getHttpServer())
      .get(`/api/materials/${material.id}`)
      .set('Authorization', `Bearer ${tenantTwo.token}`)
      .set('X-Tenant-ID', tenantTwo.tenant.id);

    expect(foreignMaterialResponse.status).toBe(404);
  });

  it('should reject supplierId from another tenant when creating or updating materials', async () => {
    const tenantOne = await createUserWithTenant(
      'materials-ref-1@example.com',
      'Tenant One',
      'materials-ref-1',
    );
    const tenantTwo = await createUserWithTenant(
      'materials-ref-2@example.com',
      'Tenant Two',
      'materials-ref-2',
    );
    const foreignSupplier = await prisma.supplier.create({
      data: { tenantId: tenantTwo.tenant.id, name: 'Proveedor Ajeno' },
    });

    const createResponse = await request(app.getHttpServer())
      .post('/api/materials')
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({
        name: 'Arena fina',
        unit: MeasurementUnit.M3,
        supplierId: foreignSupplier.id,
      });

    expect(createResponse.status).toBe(404);
    expect(createResponse.body.message).toBe('Supplier not found');

    const ownMaterial = await prisma.material.create({
      data: {
        tenantId: tenantOne.tenant.id,
        name: 'Piedra partida',
        unit: MeasurementUnit.M3,
      },
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/materials/${ownMaterial.id}`)
      .set('Authorization', `Bearer ${tenantOne.token}`)
      .set('X-Tenant-ID', tenantOne.tenant.id)
      .send({ supplierId: foreignSupplier.id });

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body.message).toBe('Supplier not found');
  });

  it('should block supplier deletion when related expenses or materials exist', async () => {
    const owner = await createUserWithTenant(
      'suppliers-delete-block@example.com',
      'Tenant One',
      'suppliers-delete-block',
    );
    const expenseBlockedSupplier = await prisma.supplier.create({
      data: { tenantId: owner.tenant.id, name: 'Proveedor con gasto' },
    });
    const materialBlockedSupplier = await prisma.supplier.create({
      data: { tenantId: owner.tenant.id, name: 'Proveedor con material' },
    });
    const category = await createExpenseCategoryForTenant(owner.tenant.id, 'Materiales');

    await prisma.expense.create({
      data: {
        tenantId: owner.tenant.id,
        categoryId: category.id,
        supplierId: expenseBlockedSupplier.id,
        createdByUserId: owner.user.id,
        amount: '100.00',
      },
    });

    await prisma.material.create({
      data: {
        tenantId: owner.tenant.id,
        supplierId: materialBlockedSupplier.id,
        name: 'Cascote reciclado',
        unit: MeasurementUnit.M3,
      },
    });

    const expenseResponse = await request(app.getHttpServer())
      .delete(`/api/suppliers/${expenseBlockedSupplier.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(expenseResponse.status).toBe(400);
    expect(expenseResponse.body.message).toBe(
      'Supplier cannot be deleted while it has related expenses or materials',
    );

    const materialResponse = await request(app.getHttpServer())
      .delete(`/api/suppliers/${materialBlockedSupplier.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(materialResponse.status).toBe(400);
    expect(materialResponse.body.message).toBe(
      'Supplier cannot be deleted while it has related expenses or materials',
    );
  });

  it('should block material deletion when used by budget items', async () => {
    const owner = await createUserWithTenant(
      'materials-delete-block@example.com',
      'Tenant One',
      'materials-delete-block',
    );
    const client = await createClientForTenant(owner.tenant.id, 'Cliente Uno');
    const material = await prisma.material.create({
      data: {
        tenantId: owner.tenant.id,
        name: 'Hierro 8mm',
        unit: MeasurementUnit.UNIT,
      },
    });

    const budget = await prisma.budget.create({
      data: {
        tenantId: owner.tenant.id,
        clientId: client.id,
        name: 'Presupuesto prueba',
        subtotalAmount: '100.00',
        discountAmount: '0.00',
        taxAmount: '0.00',
        profitAmount: '0.00',
        totalAmount: '100.00',
      },
    });

    await prisma.budgetItem.create({
      data: {
        tenantId: owner.tenant.id,
        budgetId: budget.id,
        materialId: material.id,
        category: 'MATERIAL',
        name: 'Hierro 8mm',
        quantity: '10.00',
        unit: MeasurementUnit.UNIT,
        unitPrice: '10.00',
        subtotal: '100.00',
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .delete(`/api/materials/${material.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .set('X-Tenant-ID', owner.tenant.id);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Material cannot be deleted while it is used in budget items',
    );
  });
});
