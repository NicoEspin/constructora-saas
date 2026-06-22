import {
  BudgetItemCategory,
  BudgetStatus,
  DocumentPdfLayout,
  DocumentPdfLogoSize,
  DocumentPdfType,
  ExpenseStatus,
  MeasurementUnit,
  PaymentMethod,
  PrismaClient,
  ProjectIncidentCategory,
  ProjectIncomeStatus,
  ProjectStageStatus,
  ProjectStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password';
const DEMO_TENANT = {
  slug: 'acme',
  name: 'Constructora Acme Demo',
};

function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function asMoney(value: number) {
  return value.toFixed(2);
}

async function clearTenantData(tenantId: string) {
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { tenantId } }),
    prisma.documentPdfSetting.deleteMany({ where: { tenantId } }),
    prisma.attachment.deleteMany({ where: { tenantId } }),
    prisma.projectIncident.deleteMany({ where: { tenantId } }),
    prisma.projectIncome.deleteMany({ where: { tenantId } }),
    prisma.expense.deleteMany({ where: { tenantId } }),
    prisma.budgetItem.deleteMany({ where: { tenantId } }),
    prisma.budget.deleteMany({ where: { tenantId } }),
    prisma.projectStageTask.deleteMany({ where: { tenantId } }),
    prisma.projectStage.deleteMany({ where: { tenantId } }),
    prisma.project.deleteMany({ where: { tenantId } }),
    prisma.projectTemplateStageTask.deleteMany({ where: { tenantId } }),
    prisma.projectTemplateStage.deleteMany({ where: { tenantId } }),
    prisma.projectTemplate.deleteMany({ where: { tenantId } }),
    prisma.material.deleteMany({ where: { tenantId } }),
    prisma.expenseCategory.deleteMany({ where: { tenantId } }),
    prisma.supplier.deleteMany({ where: { tenantId } }),
    prisma.client.deleteMany({ where: { tenantId } }),
  ]);
}

async function seedDocumentSettings(tenantId: string) {
  await prisma.documentPdfSetting.createMany({
    data: [
      {
        tenantId,
        documentType: DocumentPdfType.BUDGET,
        layout: DocumentPdfLayout.CLASSIC,
        primaryColor: '#1D4ED8',
        logoSize: DocumentPdfLogoSize.MEDIUM,
      },
      {
        tenantId,
        documentType: DocumentPdfType.PROJECT_OPERATIONAL_REPORT,
        layout: DocumentPdfLayout.COMPACT,
        primaryColor: '#0F766E',
        logoSize: DocumentPdfLogoSize.MEDIUM,
      },
      {
        tenantId,
        documentType: DocumentPdfType.PROJECT_EXECUTIVE_REPORT,
        layout: DocumentPdfLayout.ACCENT,
        primaryColor: '#7C3AED',
        logoSize: DocumentPdfLogoSize.MEDIUM,
      },
    ],
  });
}

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const founder = await prisma.user.upsert({
    where: { email: 'founder@yoursaas.com' },
    update: {
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Nicolás Founder',
    },
    create: {
      email: 'founder@yoursaas.com',
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Nicolás Founder',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme-demo.com' },
    update: {
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Luciana Jefa de Obra',
    },
    create: {
      email: 'manager@acme-demo.com',
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Luciana Jefa de Obra',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme-demo.com' },
    update: {
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Mariano Administración',
    },
    create: {
      email: 'admin@acme-demo.com',
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Mariano Administración',
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_TENANT.slug },
    update: { name: DEMO_TENANT.name },
    create: {
      name: DEMO_TENANT.name,
      slug: DEMO_TENANT.slug,
    },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: founder.id } },
    update: { role: Role.OWNER },
    create: { tenantId: tenant.id, userId: founder.id, role: Role.OWNER },
  });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: manager.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: manager.id, role: Role.ADMIN },
  });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: admin.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: admin.id, role: Role.ADMIN },
  });

  await clearTenantData(tenant.id);
  await seedDocumentSettings(tenant.id);

  const [clientArce, clientVerde, clientRivera] = await Promise.all([
    prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'Estudio Arce',
        email: 'arce@clientes.demo',
        phone: '+54 341 555-0101',
        address: 'Av. Pellegrini 2450, Rosario',
        taxId: '30-71234567-1',
        notes: 'Cliente premium orientado a vivienda multifamiliar.',
      },
    }),
    prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'Desarrollos Verde SA',
        email: 'verde@clientes.demo',
        phone: '+54 341 555-0102',
        address: 'Córdoba 1480, Rosario',
        taxId: '30-70999888-3',
        notes: 'Obras comerciales con foco en plazos cortos.',
      },
    }),
    prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'Familia Rivera',
        email: 'rivera@clientes.demo',
        phone: '+54 341 555-0103',
        address: 'Funes Hills, Funes',
        taxId: '27-27111222-4',
        notes: 'Remodelación residencial con alta sensibilidad al detalle.',
      },
    }),
  ]);

  const [supplierHormisur, supplierAceros, supplierElectro] = await Promise.all([
    prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Hormisur',
        trade: 'Hormigón elaborado',
        email: 'ventas@hormisur.demo',
        phone: '+54 341 555-0201',
        offerings: 'Hormigón, bombeo, aditivos.',
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Aceros del Litoral',
        trade: 'Hierros y perfilería',
        email: 'contacto@aceros.demo',
        phone: '+54 341 555-0202',
        offerings: 'Mallas, hierros ADN, perfiles y corte.',
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Electro Norte',
        trade: 'Material eléctrico',
        email: 'compras@electronorte.demo',
        phone: '+54 341 555-0203',
        offerings: 'Tableros, cableado, iluminación y protecciones.',
      },
    }),
  ]);

  const materials = await Promise.all([
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplierHormisur.id,
        name: 'Hormigón H21',
        category: 'Hormigón',
        unit: MeasurementUnit.M3,
        estimatedUnitPrice: asMoney(185000),
        lastPriceUpdatedAt: daysFromNow(-10),
      },
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplierAceros.id,
        name: 'Hierro ADN 12mm',
        category: 'Estructura',
        unit: MeasurementUnit.KG,
        estimatedUnitPrice: asMoney(2150),
        lastPriceUpdatedAt: daysFromNow(-8),
      },
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplierElectro.id,
        name: 'Cable unipolar 2.5mm',
        category: 'Instalación eléctrica',
        unit: MeasurementUnit.LINEAR_METER,
        estimatedUnitPrice: asMoney(1250),
        lastPriceUpdatedAt: daysFromNow(-6),
      },
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplierElectro.id,
        name: 'Luminaria LED industrial',
        category: 'Iluminación',
        unit: MeasurementUnit.UNIT,
        estimatedUnitPrice: asMoney(82000),
        lastPriceUpdatedAt: daysFromNow(-5),
      },
    }),
  ]);

  const expenseCategories = await Promise.all([
    prisma.expenseCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Materiales',
        description: 'Compras de materiales principales y complementarios',
        color: '#2563EB',
      },
    }),
    prisma.expenseCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Mano de obra',
        description: 'Cuadrillas, jornales y subcontratos',
        color: '#059669',
      },
    }),
    prisma.expenseCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Logística',
        description: 'Transporte, viáticos y alquileres menores',
        color: '#D97706',
      },
    }),
    prisma.expenseCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Administración',
        description: 'Gastos indirectos y soporte administrativo',
        color: '#7C3AED',
      },
    }),
  ]);

  const projectTemplate = await prisma.projectTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Obra integral de vivienda',
      description: 'Plantilla demo con etapas para vivienda unifamiliar y ampliaciones.',
      stages: {
        create: [
          {
            tenantId: tenant.id,
            name: 'Preparación y replanteo',
            description: 'Relevamiento inicial, permisos y replanteo.',
            position: 1,
            weightPercent: 10,
            tasks: {
              create: [
                { tenantId: tenant.id, title: 'Replanteo general', position: 1 },
                { tenantId: tenant.id, title: 'Cerco y cartel de obra', position: 2 },
              ],
            },
          },
          {
            tenantId: tenant.id,
            name: 'Estructura',
            description: 'Excavación, fundaciones y hormigonado.',
            position: 2,
            weightPercent: 35,
            tasks: {
              create: [
                { tenantId: tenant.id, title: 'Excavación', position: 1 },
                { tenantId: tenant.id, title: 'Hormigonado de bases', position: 2 },
              ],
            },
          },
          {
            tenantId: tenant.id,
            name: 'Instalaciones y cerramientos',
            description: 'Mampostería, instalaciones y carpinterías.',
            position: 3,
            weightPercent: 35,
            tasks: {
              create: [
                { tenantId: tenant.id, title: 'Instalación eléctrica', position: 1 },
                { tenantId: tenant.id, title: 'Aberturas', position: 2 },
              ],
            },
          },
          {
            tenantId: tenant.id,
            name: 'Terminaciones y entrega',
            description: 'Pintura, detalles finales y cierre.',
            position: 4,
            weightPercent: 20,
            tasks: {
              create: [
                { tenantId: tenant.id, title: 'Pintura final', position: 1 },
                { tenantId: tenant.id, title: 'Entrega técnica', position: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      stages: {
        orderBy: { position: 'asc' },
        include: { tasks: { orderBy: { position: 'asc' } } },
      },
    },
  });

  const projectTorre = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      clientId: clientArce.id,
      projectTemplateId: projectTemplate.id,
      managerUserId: manager.id,
      name: 'Torre Norte - Etapa 1',
      location: 'Puerto Norte, Rosario',
      startDate: daysFromNow(-75),
      actualStartDate: daysFromNow(-72),
      estimatedEndDate: daysFromNow(45),
      status: ProjectStatus.ACTIVE,
      progressPercent: 68,
      notes: 'Obra principal para seguimiento de reportes operativos y financieros.',
    },
  });

  const projectLocales = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      clientId: clientVerde.id,
      projectTemplateId: projectTemplate.id,
      managerUserId: manager.id,
      name: 'Locales Paseo Centro',
      location: 'Centro, Rosario',
      startDate: daysFromNow(-40),
      actualStartDate: daysFromNow(-39),
      estimatedEndDate: daysFromNow(20),
      status: ProjectStatus.PAUSED,
      progressPercent: 41,
      notes: 'Proyecto pausado parcialmente por demoras del cliente.',
    },
  });

  const projectRivera = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      clientId: clientRivera.id,
      projectTemplateId: projectTemplate.id,
      managerUserId: manager.id,
      name: 'Casa Rivera Remodelación',
      location: 'Funes, Santa Fe',
      startDate: daysFromNow(-130),
      actualStartDate: daysFromNow(-128),
      estimatedEndDate: daysFromNow(-15),
      actualEndDate: daysFromNow(-7),
      status: ProjectStatus.COMPLETED,
      progressPercent: 100,
      notes: 'Proyecto finalizado para tener histórico de cierre.',
    },
  });

  async function materializeProjectStages(
    projectId: string,
    managerUserId: string,
    overrides: Array<{
      status: ProjectStageStatus;
      progressPercent: number;
      estimatedStartOffset: number;
      estimatedEndOffset: number;
      actualStartOffset?: number;
      actualEndOffset?: number | null;
      notes?: string;
    }>,
  ) {
    await prisma.projectStage.createMany({
      data: projectTemplate.stages.map((templateStage, index) => ({
        tenantId: tenant.id,
        projectId,
        projectTemplateStageId: templateStage.id,
        managerUserId,
        name: templateStage.name,
        description: templateStage.description,
        status: overrides[index].status,
        progressPercent: overrides[index].progressPercent,
        weightPercent: templateStage.weightPercent,
        position: templateStage.position,
        estimatedStartDate: daysFromNow(overrides[index].estimatedStartOffset),
        estimatedEndDate: daysFromNow(overrides[index].estimatedEndOffset),
        actualStartDate:
          overrides[index].actualStartOffset !== undefined
            ? daysFromNow(overrides[index].actualStartOffset)
            : null,
        actualEndDate:
          overrides[index].actualEndOffset !== undefined && overrides[index].actualEndOffset !== null
            ? daysFromNow(overrides[index].actualEndOffset)
            : null,
        notes: overrides[index].notes ?? null,
      })),
    });

    const createdStages = await prisma.projectStage.findMany({
      where: { tenantId: tenant.id, projectId },
      orderBy: { position: 'asc' },
    });

    for (const [index, stage] of createdStages.entries()) {
      const templateStage = projectTemplate.stages[index];
      await prisma.projectStageTask.createMany({
        data: templateStage.tasks.map((task, taskIndex) => ({
          tenantId: tenant.id,
          projectStageId: stage.id,
          title: task.title,
          completed:
            overrides[index].status === ProjectStageStatus.COMPLETED
              ? true
              : overrides[index].status === ProjectStageStatus.IN_PROGRESS
                ? taskIndex === 0
                : false,
          position: task.position,
        })),
      });
    }

    return createdStages;
  }

  const torreStages = await materializeProjectStages(projectTorre.id, manager.id, [
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -75,
      estimatedEndOffset: -65,
      actualStartOffset: -72,
      actualEndOffset: -64,
    },
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -64,
      estimatedEndOffset: -20,
      actualStartOffset: -63,
      actualEndOffset: -18,
    },
    {
      status: ProjectStageStatus.IN_PROGRESS,
      progressPercent: 72,
      estimatedStartOffset: -18,
      estimatedEndOffset: 18,
      actualStartOffset: -17,
      notes: 'Avance condicionado por entregas eléctricas.',
    },
    {
      status: ProjectStageStatus.PENDING,
      progressPercent: 0,
      estimatedStartOffset: 18,
      estimatedEndOffset: 45,
    },
  ]);

  const localesStages = await materializeProjectStages(projectLocales.id, manager.id, [
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -40,
      estimatedEndOffset: -34,
      actualStartOffset: -39,
      actualEndOffset: -35,
    },
    {
      status: ProjectStageStatus.IN_PROGRESS,
      progressPercent: 58,
      estimatedStartOffset: -34,
      estimatedEndOffset: -5,
      actualStartOffset: -33,
      notes: 'Demora por aprobación del layout comercial.',
    },
    {
      status: ProjectStageStatus.PAUSED,
      progressPercent: 12,
      estimatedStartOffset: -5,
      estimatedEndOffset: 12,
      actualStartOffset: -2,
      notes: 'Cliente pausó instalaciones secundarias.',
    },
    {
      status: ProjectStageStatus.PENDING,
      progressPercent: 0,
      estimatedStartOffset: 12,
      estimatedEndOffset: 20,
    },
  ]);

  const riveraStages = await materializeProjectStages(projectRivera.id, manager.id, [
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -130,
      estimatedEndOffset: -118,
      actualStartOffset: -128,
      actualEndOffset: -117,
    },
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -118,
      estimatedEndOffset: -75,
      actualStartOffset: -117,
      actualEndOffset: -74,
    },
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -75,
      estimatedEndOffset: -30,
      actualStartOffset: -74,
      actualEndOffset: -28,
    },
    {
      status: ProjectStageStatus.COMPLETED,
      progressPercent: 100,
      estimatedStartOffset: -30,
      estimatedEndOffset: -15,
      actualStartOffset: -28,
      actualEndOffset: -7,
    },
  ]);

  const [budgetTorreApproved, budgetTorreDraft, budgetLocalesSent, budgetRiveraCompleted, budgetExpired] =
    await Promise.all([
      prisma.budget.create({
        data: {
          tenantId: tenant.id,
          clientId: clientArce.id,
          projectId: projectTorre.id,
          name: 'Torre Norte - Presupuesto contractual',
          workType: 'Edificio residencial',
          description: 'Contrato principal de estructura y cerramientos.',
          issuedAt: daysFromNow(-80),
          expiresAt: daysFromNow(-50),
          status: BudgetStatus.APPROVED,
          subtotalAmount: asMoney(18500000),
          discountAmount: asMoney(0),
          taxAmount: asMoney(1665000),
          profitAmount: asMoney(2950000),
          totalAmount: asMoney(23115000),
          commercialTerms: 'Incluye dirección técnica y coordinación de proveedores críticos.',
          paymentTerms: '35% anticipo, 40% avance estructural, 25% contra cierre.',
          estimatedExecutionTime: '6 meses',
          items: {
            create: [
              {
                tenantId: tenant.id,
                materialId: materials[0].id,
                category: BudgetItemCategory.MATERIAL,
                name: 'Hormigón y bases',
                quantity: '48',
                unit: MeasurementUnit.M3,
                unitPrice: asMoney(185000),
                subtotal: asMoney(8880000),
                position: 1,
              },
              {
                tenantId: tenant.id,
                materialId: materials[1].id,
                category: BudgetItemCategory.MATERIAL,
                name: 'Armaduras y refuerzos',
                quantity: '3200',
                unit: MeasurementUnit.KG,
                unitPrice: asMoney(2150),
                subtotal: asMoney(6880000),
                position: 2,
              },
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.LABOR,
                name: 'Cuadrilla estructura',
                quantity: '45',
                unit: MeasurementUnit.DAY,
                unitPrice: asMoney(61000),
                subtotal: asMoney(2745000),
                position: 3,
              },
            ],
          },
        },
      }),
      prisma.budget.create({
        data: {
          tenantId: tenant.id,
          clientId: clientArce.id,
          projectId: projectTorre.id,
          name: 'Torre Norte - Ampliación amenities',
          workType: 'Adicional contractual',
          description: 'Opción de ampliación para rooftop y amenities.',
          issuedAt: daysFromNow(-12),
          expiresAt: daysFromNow(14),
          status: BudgetStatus.DRAFT,
          subtotalAmount: asMoney(4200000),
          discountAmount: asMoney(120000),
          taxAmount: asMoney(367200),
          profitAmount: asMoney(610000),
          totalAmount: asMoney(5057200),
          estimatedExecutionTime: '8 semanas',
          items: {
            create: [
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.EQUIPMENT,
                name: 'Equipamiento rooftop',
                quantity: '1',
                unit: MeasurementUnit.UNIT,
                unitPrice: asMoney(1850000),
                subtotal: asMoney(1850000),
                position: 1,
              },
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.OUTSOURCED_SERVICE,
                name: 'Impermeabilización especializada',
                quantity: '1',
                unit: MeasurementUnit.UNIT,
                unitPrice: asMoney(1450000),
                subtotal: asMoney(1450000),
                position: 2,
              },
            ],
          },
        },
      }),
      prisma.budget.create({
        data: {
          tenantId: tenant.id,
          clientId: clientVerde.id,
          projectId: projectLocales.id,
          name: 'Locales Paseo Centro - implementación',
          workType: 'Locales comerciales',
          description: 'Implementación de locales con instalaciones y vidrieras.',
          issuedAt: daysFromNow(-30),
          expiresAt: daysFromNow(5),
          status: BudgetStatus.SENT,
          subtotalAmount: asMoney(7600000),
          discountAmount: asMoney(0),
          taxAmount: asMoney(684000),
          profitAmount: asMoney(890000),
          totalAmount: asMoney(9174000),
          paymentTerms: '50% anticipo, saldo contra entrega.',
          estimatedExecutionTime: '75 días',
          items: {
            create: [
              {
                tenantId: tenant.id,
                materialId: materials[2].id,
                category: BudgetItemCategory.MATERIAL,
                name: 'Cableado y distribución',
                quantity: '1800',
                unit: MeasurementUnit.LINEAR_METER,
                unitPrice: asMoney(1250),
                subtotal: asMoney(2250000),
                position: 1,
              },
              {
                tenantId: tenant.id,
                materialId: materials[3].id,
                category: BudgetItemCategory.MATERIAL,
                name: 'Luminarias de salón',
                quantity: '22',
                unit: MeasurementUnit.UNIT,
                unitPrice: asMoney(82000),
                subtotal: asMoney(1804000),
                position: 2,
              },
            ],
          },
        },
      }),
      prisma.budget.create({
        data: {
          tenantId: tenant.id,
          clientId: clientRivera.id,
          projectId: projectRivera.id,
          name: 'Casa Rivera - remodelación total',
          workType: 'Remodelación residencial',
          description: 'Presupuesto cerrado para remodelación y ampliación.',
          issuedAt: daysFromNow(-150),
          expiresAt: daysFromNow(-120),
          status: BudgetStatus.APPROVED,
          subtotalAmount: asMoney(9800000),
          discountAmount: asMoney(200000),
          taxAmount: asMoney(864000),
          profitAmount: asMoney(1340000),
          totalAmount: asMoney(11804000),
          commercialTerms: 'Incluye mobiliario fijo de cocina y seguimiento post-entrega.',
          paymentTerms: '40/40/20',
          estimatedExecutionTime: '120 días',
          items: {
            create: [
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.MATERIAL,
                name: 'Terminaciones interiores',
                quantity: '1',
                unit: MeasurementUnit.UNIT,
                unitPrice: asMoney(4200000),
                subtotal: asMoney(4200000),
                position: 1,
              },
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.LABOR,
                name: 'Cuadrilla general',
                quantity: '70',
                unit: MeasurementUnit.DAY,
                unitPrice: asMoney(54000),
                subtotal: asMoney(3780000),
                position: 2,
              },
            ],
          },
        },
      }),
      prisma.budget.create({
        data: {
          tenantId: tenant.id,
          clientId: clientVerde.id,
          name: 'Depósito logístico - propuesta preliminar',
          workType: 'Nave industrial',
          description: 'Propuesta no concretada para comparar presupuestos vencidos.',
          issuedAt: daysFromNow(-95),
          expiresAt: daysFromNow(-65),
          status: BudgetStatus.EXPIRED,
          subtotalAmount: asMoney(6400000),
          discountAmount: asMoney(0),
          taxAmount: asMoney(576000),
          profitAmount: asMoney(780000),
          totalAmount: asMoney(7756000),
          estimatedExecutionTime: '90 días',
          items: {
            create: [
              {
                tenantId: tenant.id,
                category: BudgetItemCategory.EQUIPMENT,
                name: 'Alquiler de elevadores',
                quantity: '3',
                unit: MeasurementUnit.UNIT,
                unitPrice: asMoney(480000),
                subtotal: asMoney(1440000),
                position: 1,
              },
            ],
          },
        },
      }),
    ]);

  await prisma.project.update({
    where: { id: projectTorre.id },
    data: { assignedBudget: budgetTorreApproved.totalAmount },
  });
  await prisma.project.update({
    where: { id: projectRivera.id },
    data: { assignedBudget: budgetRiveraCompleted.totalAmount },
  });

  await prisma.projectIncome.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: projectTorre.id,
        budgetId: budgetTorreApproved.id,
        receivedAt: daysFromNow(-70),
        amount: asMoney(7200000),
        status: ProjectIncomeStatus.CONFIRMED,
        description: 'Anticipo contractual',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        reference: 'TRX-ACME-001',
      },
      {
        tenantId: tenant.id,
        projectId: projectTorre.id,
        budgetId: budgetTorreApproved.id,
        receivedAt: daysFromNow(-22),
        amount: asMoney(5400000),
        status: ProjectIncomeStatus.CONFIRMED,
        description: 'Certificación estructura',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        reference: 'TRX-ACME-014',
      },
      {
        tenantId: tenant.id,
        projectId: projectTorre.id,
        budgetId: budgetTorreApproved.id,
        receivedAt: daysFromNow(10),
        amount: asMoney(3511500),
        status: ProjectIncomeStatus.PENDING,
        description: 'Saldo por cierre de etapa',
        paymentMethod: PaymentMethod.CHECK,
        reference: 'CHQ-ACME-22',
      },
      {
        tenantId: tenant.id,
        projectId: projectLocales.id,
        budgetId: budgetLocalesSent.id,
        receivedAt: daysFromNow(-8),
        amount: asMoney(1800000),
        status: ProjectIncomeStatus.PENDING,
        description: 'Seña inicial pendiente de confirmación',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
      {
        tenantId: tenant.id,
        projectId: projectRivera.id,
        budgetId: budgetRiveraCompleted.id,
        receivedAt: daysFromNow(-120),
        amount: asMoney(4721600),
        status: ProjectIncomeStatus.CONFIRMED,
        description: 'Anticipo obra Rivera',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
      {
        tenantId: tenant.id,
        projectId: projectRivera.id,
        budgetId: budgetRiveraCompleted.id,
        receivedAt: daysFromNow(-55),
        amount: asMoney(4721600),
        status: ProjectIncomeStatus.CONFIRMED,
        description: 'Segundo certificado Rivera',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
      {
        tenantId: tenant.id,
        projectId: projectRivera.id,
        budgetId: budgetRiveraCompleted.id,
        receivedAt: daysFromNow(-10),
        amount: asMoney(2360800),
        status: ProjectIncomeStatus.CONFIRMED,
        description: 'Cierre final Rivera',
        paymentMethod: PaymentMethod.CASH,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[0].id,
        projectId: projectTorre.id,
        projectStageId: torreStages[1]?.id,
        supplierId: supplierHormisur.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-63),
        dueDate: daysFromNow(-60),
        amount: asMoney(3120000),
        description: 'Hormigón de fundaciones',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: ExpenseStatus.PAID,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[0].id,
        projectId: projectTorre.id,
        projectStageId: torreStages[2]?.id,
        supplierId: supplierAceros.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-16),
        dueDate: daysFromNow(-5),
        amount: asMoney(1480000),
        description: 'Refuerzo adicional de armaduras',
        paymentMethod: PaymentMethod.CHECK,
        status: ExpenseStatus.PENDING,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[1].id,
        projectId: projectTorre.id,
        projectStageId: torreStages[2]?.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-12),
        dueDate: daysFromNow(-2),
        amount: asMoney(960000),
        description: 'Jornales de cuadrilla de instalaciones',
        paymentMethod: PaymentMethod.CASH,
        status: ExpenseStatus.PENDING,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[2].id,
        projectId: projectLocales.id,
        projectStageId: localesStages[1]?.id,
        supplierId: supplierElectro.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-18),
        dueDate: daysFromNow(4),
        amount: asMoney(540000),
        description: 'Entrega parcial de tableros y logística',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: ExpenseStatus.PAID,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[3].id,
        projectId: projectLocales.id,
        createdByUserId: founder.id,
        expenseDate: daysFromNow(-7),
        dueDate: daysFromNow(6),
        amount: asMoney(185000),
        description: 'Honorarios municipales y habilitaciones',
        paymentMethod: PaymentMethod.OTHER,
        status: ExpenseStatus.PENDING,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[1].id,
        projectId: projectRivera.id,
        projectStageId: riveraStages[3]?.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-20),
        dueDate: daysFromNow(-15),
        amount: asMoney(620000),
        description: 'Terminaciones finales y retoques',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: ExpenseStatus.PAID,
      },
      {
        tenantId: tenant.id,
        categoryId: expenseCategories[2].id,
        projectId: projectRivera.id,
        createdByUserId: admin.id,
        expenseDate: daysFromNow(-25),
        dueDate: daysFromNow(-18),
        amount: asMoney(120000),
        description: 'Viajes de supervisión reprogramados',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: ExpenseStatus.CANCELLED,
      },
    ],
  });

  await prisma.projectIncident.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: projectTorre.id,
        projectStageId: torreStages[2]?.id,
        incidentDate: daysFromNow(-9),
        reason: 'Demora en entrega de tableros eléctricos',
        category: ProjectIncidentCategory.SUPPLIER,
        delayDays: 2,
        delayHours: 4,
        notes: 'Reprogramar montaje de bandejas y tableros.',
      },
      {
        tenantId: tenant.id,
        projectId: projectTorre.id,
        projectStageId: torreStages[2]?.id,
        incidentDate: daysFromNow(-4),
        reason: 'Lluvia intensa durante tareas exteriores',
        category: ProjectIncidentCategory.WEATHER,
        delayDays: 1,
        delayHours: 6,
      },
      {
        tenantId: tenant.id,
        projectId: projectLocales.id,
        projectStageId: localesStages[2]?.id,
        incidentDate: daysFromNow(-6),
        reason: 'Cliente pausó layout definitivo',
        category: ProjectIncidentCategory.CLIENT,
        delayDays: 3,
        delayHours: 0,
        notes: 'La pausa afecta carpinterías y cielorrasos.',
      },
    ],
  });

  console.info('Seed complete:', {
    tenant: DEMO_TENANT.slug,
    account: {
      email: founder.email,
      password: DEMO_PASSWORD,
    },
    users: [founder.email, manager.email, admin.email],
    clients: 3,
    suppliers: 3,
    materials: materials.length,
    projects: 3,
    budgets: 5,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
