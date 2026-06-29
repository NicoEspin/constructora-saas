import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BudgetStatus,
  ExpenseStatus,
  Prisma,
  ProjectIncomeStatus,
  ProjectStageStatus,
  ProjectStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ConvertBudgetToProjectDto } from './dto/convert-budget-to-project.dto';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { ApplyProjectTemplateDto } from './dto/apply-project-template.dto';

const projectDetailsInclude = {
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      taxId: true,
    },
  },
  projectTemplate: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  manager: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
  budgets: {
    select: {
      id: true,
      name: true,
      status: true,
      profitAmount: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  incomes: {
    select: {
      id: true,
      projectId: true,
      budgetId: true,
      receivedAt: true,
      amount: true,
      status: true,
      description: true,
      paymentMethod: true,
      reference: true,
      notes: true,
      attachments: {
        select: {
          id: true,
          tenantId: true,
          uploadedByUserId: true,
          kind: true,
          fileName: true,
          storageKey: true,
          mimeType: true,
          fileSizeBytes: true,
          notes: true,
          expenseId: true,
          projectId: true,
          projectIncomeId: true,
          projectStageId: true,
          clientId: true,
          budgetId: true,
          createdAt: true,
          updatedAt: true,
        } satisfies Prisma.AttachmentSelect,
        orderBy: [{ createdAt: 'desc' as const }],
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ receivedAt: 'desc' as const }, { createdAt: 'desc' as const }],
  },
  incidents: {
    select: {
      id: true,
      projectId: true,
      projectStageId: true,
      incidentDate: true,
      reason: true,
      category: true,
      delayDays: true,
      delayHours: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ incidentDate: 'desc' as const }, { createdAt: 'desc' as const }],
  },
  stages: {
    select: {
      id: true,
      name: true,
      status: true,
      progressPercent: true,
      weightPercent: true,
      position: true,
      estimatedStartDate: true,
      estimatedEndDate: true,
      actualStartDate: true,
      actualEndDate: true,
    },
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.ProjectInclude;

const projectListInclude = {
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  projectTemplate: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  manager: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
} satisfies Prisma.ProjectInclude;

const projectStageInclude = {
  manager: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
  projectTemplateStage: {
    select: {
      id: true,
      projectTemplateId: true,
      name: true,
      position: true,
      weightPercent: true,
    },
  },
  tasks: {
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.ProjectStageInclude;

type PrismaTransaction = Prisma.TransactionClient;
type PrismaProjectWriteClient = Pick<
  PrismaTransaction,
  'project' | 'projectStage' | 'projectStageTask' | 'projectTemplateStage'
>;

type SummaryMessage = {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
};

type ProgressAnalysis = {
  progressPercent: number;
  alerts: SummaryMessage[];
  warnings: SummaryMessage[];
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateProjectDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    this.validateProjectDates(dto.startDate ?? null, dto.estimatedEndDate ?? null);
    this.validateProjectDates(dto.actualStartDate ?? null, dto.actualEndDate ?? null, 'actual');

    await this.validateReferences(
      tenantId,
      dto.clientId ?? null,
      dto.projectTemplateId ?? null,
      dto.managerUserId ?? null,
    );

    const project = await this.prisma.project.create({
      data: {
        tenantId,
        clientId: dto.clientId ?? null,
        projectTemplateId: dto.projectTemplateId ?? null,
        managerUserId: dto.managerUserId ?? null,
        name: this.requireTrimmedString(dto.name, 'Project name is required'),
        location: this.normalizeOptionalString(dto.location),
        startDate: dto.startDate ?? null,
        actualStartDate: dto.actualStartDate ?? null,
        estimatedEndDate: dto.estimatedEndDate ?? null,
        actualEndDate: dto.actualEndDate ?? null,
        status: dto.status ?? ProjectStatus.PENDING,
        progressPercent: 0,
        notes: this.normalizeOptionalString(dto.notes),
      },
    });

    await this.materializeStagesFromTemplate(
      this.prisma,
      tenantId,
      project.id,
      dto.projectTemplateId ?? null,
    );

    await this.auditService.log({
      action: 'project.create',
      entity: 'project',
      entityId: project.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: project.name, status: project.status },
    });

    return this.findProjectOrThrow(tenantId, project.id);
  }

  async findAll(tenantId: string, query: ListProjectsQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ProjectWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: projectListInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      page,
      take,
      total,
      totalPages: Math.ceil(total / take),
      hasNextPage: skip + items.length < total,
      hasPreviousPage: page > 1,
      tenantId,
    };
  }

  async findOne(tenantId: string, id: string) {
    this.assertTenantId(tenantId);
    return this.findProjectOrThrow(tenantId, id);
  }

  async findSummary(tenantId: string, id: string) {
    this.assertTenantId(tenantId);
    const project = await this.findProjectOrThrow(tenantId, id);
    return project.summary;
  }

  async findStages(tenantId: string, projectId: string) {
    this.assertTenantId(tenantId);
    await this.findProjectHeaderOrThrow(tenantId, projectId);

    return this.prisma.projectStage.findMany({
      where: { tenantId, projectId },
      include: projectStageInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createStage(
    tenantId: string,
    projectId: string,
    dto: CreateProjectStageDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    const project = await this.findProjectHeaderOrThrow(tenantId, projectId);
    this.validateStageDates(dto, project);
    const tasks = this.normalizeProjectStageTasks(dto.tasks ?? []);
    const progressPercent =
      dto.tasks !== undefined
        ? this.calculateStageProgressFromTasks(tasks)
        : this.normalizePercent(dto.progressPercent ?? 0);
    const status = this.resolveStageStatusForTaskProgress(progressPercent, dto.status);

    const stage = await this.prisma.$transaction(async (tx) => {
      await this.validateStageReferences(
        tx,
        tenantId,
        project,
        dto.managerUserId ?? null,
        dto.projectTemplateStageId ?? null,
      );

      const position = dto.position ?? (await this.findNextStagePosition(tx, tenantId, projectId));

      await this.ensureStagePositionAvailable(tx, tenantId, projectId, position);

      const createdStage = await tx.projectStage.create({
        data: {
          tenantId,
          projectId,
          projectTemplateStageId: dto.projectTemplateStageId ?? null,
          managerUserId: dto.managerUserId ?? null,
          name: this.requireTrimmedString(dto.name, 'Project stage name is required'),
          description: this.normalizeOptionalString(dto.description),
          status,
          progressPercent,
          weightPercent: dto.weightPercent ?? null,
          position,
          estimatedStartDate: dto.estimatedStartDate ?? null,
          estimatedEndDate: dto.estimatedEndDate ?? null,
          actualStartDate: dto.actualStartDate ?? null,
          actualEndDate: dto.actualEndDate ?? null,
          notes: this.normalizeOptionalString(dto.notes),
        },
      });

      await this.replaceProjectStageTasks(tx, tenantId, createdStage.id, tasks);

      const stageWithTasks = await tx.projectStage.findFirstOrThrow({
        where: { id: createdStage.id, tenantId, projectId },
        include: projectStageInclude,
      });

      await this.syncProjectProgress(tx, tenantId, projectId);
      return stageWithTasks;
    });

    await this.auditService.log({
      action: 'project-stage.create',
      entity: 'project-stage',
      entityId: stage.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId,
        name: stage.name,
        status: stage.status,
        progressPercent: stage.progressPercent,
        tasksCount: stage.tasks.length,
      },
    });

    return stage;
  }

  async findStage(tenantId: string, projectId: string, stageId: string) {
    this.assertTenantId(tenantId);
    await this.findProjectHeaderOrThrow(tenantId, projectId);
    return this.findStageOrThrow(tenantId, projectId, stageId);
  }

  async updateStage(
    tenantId: string,
    projectId: string,
    stageId: string,
    dto: UpdateProjectStageDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    const project = await this.findProjectHeaderOrThrow(tenantId, projectId);
    const existing = await this.findStageOrThrow(tenantId, projectId, stageId);
    this.validateStageDates(
      {
        estimatedStartDate:
          dto.estimatedStartDate !== undefined
            ? (dto.estimatedStartDate ?? null)
            : existing.estimatedStartDate,
        estimatedEndDate:
          dto.estimatedEndDate !== undefined
            ? (dto.estimatedEndDate ?? null)
            : existing.estimatedEndDate,
        actualStartDate:
          dto.actualStartDate !== undefined
            ? (dto.actualStartDate ?? null)
            : existing.actualStartDate,
        actualEndDate:
          dto.actualEndDate !== undefined ? (dto.actualEndDate ?? null) : existing.actualEndDate,
      },
      project,
    );

    const resolvedManagerUserId =
      dto.managerUserId !== undefined ? dto.managerUserId : existing.managerUserId;
    const resolvedPosition = dto.position ?? existing.position;
    const tasks =
      dto.tasks !== undefined
        ? this.normalizeProjectStageTasks(dto.tasks)
        : existing.tasks.map((task) => ({ title: task.title, completed: task.completed }));
    const progressPercent =
      dto.tasks !== undefined
        ? this.calculateStageProgressFromTasks(tasks)
        : this.normalizePercent(dto.progressPercent ?? existing.progressPercent);
    const status = this.resolveStageStatusForTaskProgress(
      progressPercent,
      dto.status,
      existing.status,
    );

    const stage = await this.prisma.$transaction(async (tx) => {
      await this.validateStageReferences(
        tx,
        tenantId,
        project,
        resolvedManagerUserId ?? null,
        dto.projectTemplateStageId !== undefined ? (dto.projectTemplateStageId ?? null) : null,
      );
      await this.ensureStagePositionAvailable(tx, tenantId, projectId, resolvedPosition, stageId);

      const updatedStage = await tx.projectStage.update({
        where: { id: stageId },
        data: {
          ...(dto.name !== undefined
            ? { name: this.requireTrimmedString(dto.name, 'Project stage name is required') }
            : {}),
          ...(dto.description !== undefined
            ? { description: this.normalizeOptionalString(dto.description) }
            : {}),
          status,
          progressPercent,
          ...(dto.weightPercent !== undefined ? { weightPercent: dto.weightPercent ?? null } : {}),
          ...(dto.position !== undefined ? { position: dto.position } : {}),
          ...(dto.managerUserId !== undefined ? { managerUserId: dto.managerUserId ?? null } : {}),
          ...(dto.projectTemplateStageId !== undefined
            ? { projectTemplateStageId: dto.projectTemplateStageId ?? null }
            : {}),
          ...(dto.estimatedStartDate !== undefined
            ? { estimatedStartDate: dto.estimatedStartDate ?? null }
            : {}),
          ...(dto.estimatedEndDate !== undefined
            ? { estimatedEndDate: dto.estimatedEndDate ?? null }
            : {}),
          ...(dto.actualStartDate !== undefined
            ? { actualStartDate: dto.actualStartDate ?? null }
            : {}),
          ...(dto.actualEndDate !== undefined ? { actualEndDate: dto.actualEndDate ?? null } : {}),
          ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
        },
      });

      if (dto.tasks !== undefined) {
        await this.replaceProjectStageTasks(tx, tenantId, stageId, tasks);
      }

      const stageWithTasks = await tx.projectStage.findFirstOrThrow({
        where: { id: updatedStage.id, tenantId, projectId },
        include: projectStageInclude,
      });

      await this.syncProjectProgress(tx, tenantId, projectId);
      return stageWithTasks;
    });

    await this.auditService.log({
      action: 'project-stage.update',
      entity: 'project-stage',
      entityId: stage.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId,
        name: stage.name,
        status: stage.status,
        progressPercent: stage.progressPercent,
        tasksCount: stage.tasks.length,
      },
    });

    return stage;
  }

  async removeStage(tenantId: string, projectId: string, stageId: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    await this.findProjectHeaderOrThrow(tenantId, projectId);
    const existing = await this.findStageOrThrow(tenantId, projectId, stageId);

    await this.prisma.$transaction(async (tx) => {
      await tx.projectStage.delete({ where: { id: stageId } });
      await this.syncProjectProgress(tx, tenantId, projectId);
    });

    await this.auditService.log({
      action: 'project-stage.delete',
      entity: 'project-stage',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId,
        name: existing.name,
        status: existing.status,
        progressPercent: existing.progressPercent,
      },
    });

    return { success: true };
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findProjectOrThrow(tenantId, id);
    this.validateProjectDates(
      dto.startDate !== undefined ? (dto.startDate ?? null) : existing.startDate,
      dto.estimatedEndDate !== undefined
        ? (dto.estimatedEndDate ?? null)
        : existing.estimatedEndDate,
    );
    this.validateProjectDates(
      dto.actualStartDate !== undefined ? (dto.actualStartDate ?? null) : existing.actualStartDate,
      dto.actualEndDate !== undefined ? (dto.actualEndDate ?? null) : existing.actualEndDate,
      'actual',
    );
    const resolvedClientId = dto.clientId !== undefined ? dto.clientId : existing.clientId;
    const resolvedProjectTemplateId =
      dto.projectTemplateId !== undefined ? dto.projectTemplateId : existing.projectTemplateId;
    const resolvedManagerUserId =
      dto.managerUserId !== undefined ? dto.managerUserId : existing.managerUserId;

    await this.validateReferences(
      tenantId,
      resolvedClientId ?? null,
      resolvedProjectTemplateId ?? null,
      resolvedManagerUserId ?? null,
    );

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.clientId !== undefined ? { clientId: dto.clientId ?? null } : {}),
        ...(dto.projectTemplateId !== undefined
          ? { projectTemplateId: dto.projectTemplateId ?? null }
          : {}),
        ...(dto.managerUserId !== undefined ? { managerUserId: dto.managerUserId ?? null } : {}),
        ...(dto.name !== undefined
          ? { name: this.requireTrimmedString(dto.name, 'Project name is required') }
          : {}),
        ...(dto.location !== undefined
          ? { location: this.normalizeOptionalString(dto.location) }
          : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate ?? null } : {}),
        ...(dto.actualStartDate !== undefined
          ? { actualStartDate: dto.actualStartDate ?? null }
          : {}),
        ...(dto.estimatedEndDate !== undefined
          ? { estimatedEndDate: dto.estimatedEndDate ?? null }
          : {}),
        ...(dto.actualEndDate !== undefined ? { actualEndDate: dto.actualEndDate ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
      },
      include: projectDetailsInclude,
    });

    await this.auditService.log({
      action: 'project.update',
      entity: 'project',
      entityId: project.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: project.name, status: project.status },
    });

    return this.findProjectOrThrow(tenantId, project.id);
  }

  async applyTemplate(
    tenantId: string,
    id: string,
    dto: ApplyProjectTemplateDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    if ((dto.mode ?? 'append') !== 'append') {
      throw new BadRequestException('Only append mode is supported');
    }

    const project = await this.findProjectHeaderOrThrow(tenantId, id);

    if (!project.projectTemplateId) {
      throw new BadRequestException('Project has no linked template');
    }

    const createdStagesCount = await this.materializeStagesFromTemplate(
      this.prisma,
      tenantId,
      id,
      project.projectTemplateId,
    );

    await this.auditService.log({
      action: 'project.template-apply',
      entity: 'project',
      entityId: id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectTemplateId: project.projectTemplateId,
        mode: 'append',
        createdStagesCount,
      },
    });

    return {
      project: await this.findProjectOrThrow(tenantId, id),
      createdStagesCount,
    };
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findProjectOrThrow(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.budget.updateMany({
        where: { tenantId, projectId: id },
        data: { projectId: null },
      });
      await tx.projectStage.deleteMany({ where: { tenantId, projectId: id } });
      await tx.project.delete({ where: { id } });
    });

    await this.auditService.log({
      action: 'project.delete',
      entity: 'project',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name, status: existing.status },
    });

    return { success: true };
  }

  async convertFromBudget(
    tenantId: string,
    budgetId: string,
    dto: ConvertBudgetToProjectDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);
    this.validateProjectDates(dto.startDate ?? null, dto.estimatedEndDate ?? null);

    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        projectId: true,
        name: true,
        status: true,
        totalAmount: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.status !== BudgetStatus.APPROVED) {
      throw new BadRequestException('Only approved budgets can be converted into projects');
    }

    if (budget.projectId) {
      throw new BadRequestException('Budget is already linked to a project');
    }

    await this.validateReferences(
      tenantId,
      budget.clientId,
      dto.projectTemplateId ?? null,
      dto.managerUserId ?? null,
    );

    const project = await this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          tenantId,
          clientId: budget.clientId,
          projectTemplateId: dto.projectTemplateId ?? null,
          managerUserId: dto.managerUserId ?? null,
          name: this.requireTrimmedString(dto.name ?? budget.name, 'Project name is required'),
          location: this.normalizeOptionalString(dto.location),
          startDate: dto.startDate ?? null,
          estimatedEndDate: dto.estimatedEndDate ?? null,
          status: ProjectStatus.PENDING,
          assignedBudget: budget.totalAmount,
          progressPercent: 0,
          notes: this.normalizeOptionalString(dto.notes),
        },
        select: { id: true, name: true, assignedBudget: true },
      });

      await tx.budget.update({
        where: { id: budget.id },
        data: { projectId: createdProject.id },
      });

      return createdProject;
    });

    await this.materializeStagesFromTemplate(
      this.prisma,
      tenantId,
      project.id,
      dto.projectTemplateId ?? null,
    );

    await this.auditService.log({
      action: 'project.convert',
      entity: 'project',
      entityId: project.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        name: project.name,
        budgetId: budget.id,
        assignedBudget: project.assignedBudget?.toString(),
      },
    });

    return this.findProjectOrThrow(tenantId, project.id);
  }

  private async findProjectOrThrow(tenantId: string, id: string) {
    const [project, expenses] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id, tenantId },
        include: projectDetailsInclude,
      }),
      this.prisma.expense.findMany({
        where: {
          tenantId,
          projectId: id,
        },
        select: {
          amount: true,
          status: true,
          dueDate: true,
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...project,
      summary: this.buildProjectSummary(project, expenses),
    };
  }

  private buildProjectSummary(
    project: {
      startDate: Date | null;
      actualStartDate: Date | null;
      estimatedEndDate: Date | null;
      actualEndDate: Date | null;
      status: ProjectStatus;
      progressPercent: number;
      budgets: Array<{
        id: string;
        name: string;
        status: BudgetStatus;
        profitAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        createdAt: Date;
      }>;
      incomes: Array<{
        id: string;
        amount: Prisma.Decimal;
        status: ProjectIncomeStatus;
        budgetId: string | null;
      }>;
      incidents: Array<{
        id: string;
        projectStageId: string | null;
        category: string | null;
        delayDays: number;
        delayHours: number;
      }>;
      stages: Array<{
        id: string;
        name: string;
        status: ProjectStageStatus;
        progressPercent: number;
        weightPercent: number | null;
        estimatedStartDate: Date | null;
        estimatedEndDate: Date | null;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
      }>;
    },
    expenses: Array<{
      amount: Prisma.Decimal;
      status: ExpenseStatus;
      dueDate: Date | null;
    }>,
  ) {
    const now = new Date();
    const alerts: SummaryMessage[] = [];
    const warnings: SummaryMessage[] = [];
    const progressAnalysis = this.analyzeProjectProgress(project.stages);

    alerts.push(...progressAnalysis.alerts);
    warnings.push(...progressAnalysis.warnings);

    const confirmedCollectedAmount = project.incomes
      .filter((income) => income.status === ProjectIncomeStatus.CONFIRMED)
      .reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
    const pendingCollectedAmount = project.incomes
      .filter((income) => income.status === ProjectIncomeStatus.PENDING)
      .reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
    const cancelledCollectedAmount = project.incomes
      .filter((income) => income.status === ProjectIncomeStatus.CANCELLED)
      .reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
    const totalCollectedAmount = confirmedCollectedAmount;

    const totalRecordedExpenseAmount = expenses
      .filter((expense) => expense.status !== ExpenseStatus.CANCELLED)
      .reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    const paidExpenseAmount = expenses
      .filter((expense) => expense.status === ExpenseStatus.PAID)
      .reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    const pendingExpenseAmount = expenses
      .filter((expense) => expense.status === ExpenseStatus.PENDING)
      .reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    const overdueExpenses = expenses.filter(
      (expense) =>
        expense.status === ExpenseStatus.PENDING &&
        expense.dueDate !== null &&
        expense.dueDate < now,
    );
    const overdueExpenseAmount = overdueExpenses.reduce(
      (sum, expense) => sum.plus(expense.amount),
      new Prisma.Decimal(0),
    );
    const cancelledExpenseAmount = expenses
      .filter((expense) => expense.status === ExpenseStatus.CANCELLED)
      .reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));

    const realGrossMarginAmount = confirmedCollectedAmount.minus(paidExpenseAmount);
    const realizedGrossMarginAmount = realGrossMarginAmount;
    const realizedGrossMarginPercent = totalCollectedAmount.gt(0)
      ? Number(realizedGrossMarginAmount.dividedBy(totalCollectedAmount).mul(100).toFixed(2))
      : null;

    const latestApprovedBudget = project.budgets.find(
      (budget) => budget.status === BudgetStatus.APPROVED,
    );
    const latestBudget = project.budgets[0] ?? null;
    const selectedBudget =
      latestApprovedBudget ??
      project.budgets.find((budget) => budget.status !== BudgetStatus.REJECTED) ??
      latestBudget;
    const approvedBudgetAmount = latestApprovedBudget?.totalAmount ?? null;
    const latestBudgetAmount = latestBudget?.totalAmount ?? null;
    const estimatedBudgetMarginAmount = selectedBudget?.profitAmount ?? null;
    const estimatedBudgetMarginPercent =
      selectedBudget && selectedBudget.totalAmount.gt(0)
        ? Number(
            selectedBudget.profitAmount.dividedBy(selectedBudget.totalAmount).mul(100).toFixed(2),
          )
        : null;
    const remainingToCollectAmount = approvedBudgetAmount
      ? approvedBudgetAmount.minus(confirmedCollectedAmount)
      : null;
    const projectedGrossMarginAmount = approvedBudgetAmount
      ? approvedBudgetAmount.minus(totalRecordedExpenseAmount)
      : null;
    const budgetVsExpenseDeviationAmount = approvedBudgetAmount
      ? totalRecordedExpenseAmount.minus(approvedBudgetAmount)
      : null;
    const budgetVsExpenseDeviationPercent =
      approvedBudgetAmount && approvedBudgetAmount.gt(0) && budgetVsExpenseDeviationAmount
        ? Number(budgetVsExpenseDeviationAmount.dividedBy(approvedBudgetAmount).mul(100).toFixed(2))
        : null;

    const totalDelayHours = project.incidents.reduce(
      (sum, incident) => sum + incident.delayDays * 24 + incident.delayHours,
      0,
    );
    const totalDelayDays = Number((totalDelayHours / 24).toFixed(2));
    const adjustedEstimatedEndDate = project.estimatedEndDate
      ? new Date(project.estimatedEndDate.getTime() + totalDelayHours * 60 * 60 * 1000)
      : null;

    const missingEstimatedStageCount = project.stages.filter(
      (stage) => !stage.estimatedEndDate,
    ).length;
    const completedStagesCount = project.stages.filter(
      (stage) => stage.status === ProjectStageStatus.COMPLETED,
    ).length;
    const inProgressStagesCount = project.stages.filter(
      (stage) => stage.status === ProjectStageStatus.IN_PROGRESS,
    ).length;
    const pendingStagesCount = project.stages.filter(
      (stage) => stage.status === ProjectStageStatus.PENDING,
    ).length;
    const blockedStagesCount = project.stages.filter(
      (stage) => stage.status === ProjectStageStatus.PAUSED,
    ).length;
    const overdueStages = project.stages.filter(
      (stage) =>
        stage.estimatedEndDate !== null &&
        stage.estimatedEndDate < now &&
        stage.status !== ProjectStageStatus.COMPLETED,
    );
    const outsideProjectRangeStages = project.stages.filter((stage) =>
      this.isStageOutsideProjectRange(project, stage),
    );

    if (!latestApprovedBudget) {
      alerts.push({
        code: 'PROJECT_WITHOUT_APPROVED_BUDGET',
        message: 'La obra no tiene un presupuesto aprobado.',
      });
    }

    if (totalRecordedExpenseAmount.gt(0) && project.budgets.length === 0) {
      alerts.push({
        code: 'EXPENSES_WITHOUT_BUDGET',
        message: 'La obra registra gastos pero no tiene presupuesto asociado.',
      });
    }

    if (
      confirmedCollectedAmount.plus(pendingCollectedAmount).plus(cancelledCollectedAmount).gt(0) &&
      project.budgets.length === 0
    ) {
      alerts.push({
        code: 'INCOMES_WITHOUT_BUDGET',
        message: 'La obra registra ingresos pero no tiene presupuesto asociado.',
      });
    }

    if (missingEstimatedStageCount > 0) {
      alerts.push({
        code: 'STAGES_MISSING_ESTIMATED_DATES',
        message: 'Hay etapas sin fecha estimada de finalizacion.',
        meta: { count: missingEstimatedStageCount },
      });
    }

    if (overdueExpenses.length > 0) {
      alerts.push({
        code: 'OVERDUE_PENDING_EXPENSES',
        message: 'La obra tiene gastos pendientes vencidos.',
        meta: { count: overdueExpenses.length },
      });
    }

    if (totalDelayHours > 0) {
      alerts.push({
        code: 'ACCUMULATED_INCIDENT_DELAYS',
        message: 'La obra acumula contratiempos que afectan el cronograma.',
        meta: { totalDelayHours, incidentCount: project.incidents.length },
      });
    }

    if (
      project.estimatedEndDate !== null &&
      project.estimatedEndDate < now &&
      project.status !== ProjectStatus.COMPLETED
    ) {
      alerts.push({
        code: 'PROJECT_OVERDUE',
        message: 'La obra esta vencida segun su fecha estimada de finalizacion.',
        meta: { estimatedEndDate: project.estimatedEndDate.toISOString() },
      });
    }

    if (overdueStages.length > 0) {
      alerts.push({
        code: 'OVERDUE_STAGES',
        message: 'Hay etapas vencidas segun su fecha estimada y aun no completadas.',
        meta: { count: overdueStages.length },
      });
    }

    if (realGrossMarginAmount.lt(0)) {
      alerts.push({
        code: 'NEGATIVE_REAL_GROSS_MARGIN',
        message: 'El margen bruto real es negativo.',
      });
    }

    if (approvedBudgetAmount && totalRecordedExpenseAmount.gt(approvedBudgetAmount)) {
      alerts.push({
        code: 'EXPENSES_OVER_APPROVED_BUDGET',
        message: 'El gasto real acumulado supera el presupuesto aprobado.',
      });
    }

    if (outsideProjectRangeStages.length > 0) {
      warnings.push({
        code: 'STAGE_DATES_OUTSIDE_PROJECT_RANGE',
        message: 'Hay fechas de etapa fuera del rango de la obra.',
        meta: { count: outsideProjectRangeStages.length },
      });
    }

    return {
      progressPercent: progressAnalysis.progressPercent,
      totalCollectedAmount: totalCollectedAmount.toString(),
      confirmedCollectedAmount: confirmedCollectedAmount.toString(),
      pendingCollectedAmount: pendingCollectedAmount.toString(),
      cancelledCollectedAmount: cancelledCollectedAmount.toString(),
      totalRecordedExpenseAmount: totalRecordedExpenseAmount.toString(),
      paidExpenseAmount: paidExpenseAmount.toString(),
      pendingExpenseAmount: pendingExpenseAmount.toString(),
      overdueExpenseAmount: overdueExpenseAmount.toString(),
      cancelledExpenseAmount: cancelledExpenseAmount.toString(),
      approvedBudgetAmount: approvedBudgetAmount?.toString() ?? null,
      latestBudgetAmount: latestBudgetAmount?.toString() ?? null,
      selectedBudgetId: selectedBudget?.id ?? null,
      selectedBudgetStatus: selectedBudget?.status ?? null,
      remainingToCollectAmount: remainingToCollectAmount?.toString() ?? null,
      realGrossMarginAmount: realGrossMarginAmount.toString(),
      projectedGrossMarginAmount: projectedGrossMarginAmount?.toString() ?? null,
      budgetVsExpenseDeviationAmount: budgetVsExpenseDeviationAmount?.toString() ?? null,
      budgetVsExpenseDeviationPercent,
      realizedGrossMarginAmount: realizedGrossMarginAmount.toString(),
      realizedGrossMarginPercent,
      estimatedBudgetMarginAmount: estimatedBudgetMarginAmount?.toString() ?? null,
      estimatedBudgetMarginPercent,
      estimatedBudgetMarginBudgetName: selectedBudget?.name ?? null,
      estimatedBudgetMarginSource: selectedBudget
        ? latestApprovedBudget
          ? 'latest-approved-budget'
          : selectedBudget === latestBudget
            ? 'latest-budget'
            : 'latest-non-rejected-budget'
        : null,
      incidentCount: project.incidents.length,
      totalDelayHours,
      totalDelayDays,
      adjustedEstimatedEndDate: adjustedEstimatedEndDate?.toISOString() ?? null,
      stagesCount: project.stages.length,
      completedStagesCount,
      inProgressStagesCount,
      pendingStagesCount,
      blockedStagesCount,
      alerts,
      warnings,
    };
  }

  private async findProjectHeaderOrThrow(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        projectTemplateId: true,
        name: true,
        startDate: true,
        actualStartDate: true,
        estimatedEndDate: true,
        actualEndDate: true,
        status: true,
        progressPercent: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async findStageOrThrow(tenantId: string, projectId: string, stageId: string) {
    const stage = await this.prisma.projectStage.findFirst({
      where: { id: stageId, tenantId, projectId },
      include: projectStageInclude,
    });

    if (!stage) {
      throw new NotFoundException('Project stage not found');
    }

    return stage;
  }

  private async validateReferences(
    tenantId: string,
    clientId: string | null,
    projectTemplateId: string | null,
    managerUserId: string | null,
  ) {
    const [client, projectTemplate, membership] = await Promise.all([
      clientId
        ? this.prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } })
        : Promise.resolve(null),
      projectTemplateId
        ? this.prisma.projectTemplate.findFirst({
            where: { id: projectTemplateId, tenantId },
            select: { id: true },
          })
        : Promise.resolve(null),
      managerUserId
        ? this.prisma.membership.findUnique({
            where: {
              tenantId_userId: {
                tenantId,
                userId: managerUserId,
              },
            },
            select: { userId: true },
          })
        : Promise.resolve(null),
    ]);

    if (clientId && !client) {
      throw new NotFoundException('Client not found');
    }

    if (projectTemplateId && !projectTemplate) {
      throw new NotFoundException('Project template not found');
    }

    if (managerUserId && !membership) {
      throw new NotFoundException('Manager user not found');
    }
  }

  private async validateStageReferences(
    tx: PrismaTransaction,
    tenantId: string,
    project: { projectTemplateId: string | null },
    managerUserId: string | null,
    projectTemplateStageId: string | null,
  ) {
    const [membership, templateStage] = await Promise.all([
      managerUserId
        ? tx.membership.findUnique({
            where: {
              tenantId_userId: {
                tenantId,
                userId: managerUserId,
              },
            },
            select: { userId: true },
          })
        : Promise.resolve(null),
      projectTemplateStageId
        ? tx.projectTemplateStage.findFirst({
            where: { id: projectTemplateStageId, tenantId },
            select: { id: true, projectTemplateId: true },
          })
        : Promise.resolve(null),
    ]);

    if (managerUserId && !membership) {
      throw new NotFoundException('Manager user not found');
    }

    if (!projectTemplateStageId) {
      return;
    }

    if (!templateStage) {
      throw new NotFoundException('Project template stage not found');
    }

    if (
      !project.projectTemplateId ||
      templateStage.projectTemplateId !== project.projectTemplateId
    ) {
      throw new BadRequestException(
        'Project template stage does not belong to the project template',
      );
    }
  }

  private async materializeStagesFromTemplate(
    db: PrismaProjectWriteClient,
    tenantId: string,
    projectId: string,
    projectTemplateId: string | null,
  ) {
    if (!projectTemplateId) {
      return 0;
    }

    const templateStages = await db.projectTemplateStage.findMany({
      where: { tenantId, projectTemplateId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        position: true,
        weightPercent: true,
        tasks: {
          select: {
            title: true,
            position: true,
          },
          orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
        },
      },
    });

    if (templateStages.length === 0) {
      return 0;
    }

    const positionOffset = (await this.findNextStagePosition(db, tenantId, projectId)) - 1;

    for (const stage of templateStages) {
      const materializedStage = await db.projectStage.create({
        data: {
          tenantId,
          projectId,
          projectTemplateStageId: stage.id,
          managerUserId: null,
          name: stage.name,
          description: stage.description,
          status: ProjectStageStatus.PENDING,
          progressPercent: 0,
          weightPercent: stage.weightPercent,
          position: positionOffset + stage.position,
          estimatedStartDate: null,
          estimatedEndDate: null,
          notes: null,
        },
        select: { id: true },
      });

      await this.replaceProjectStageTasks(
        db,
        tenantId,
        materializedStage.id,
        stage.tasks.map((task) => ({ title: task.title, completed: false })),
      );
    }

    await this.syncProjectProgress(db, tenantId, projectId);
    return templateStages.length;
  }

  private async findNextStagePosition(
    db: PrismaProjectWriteClient,
    tenantId: string,
    projectId: string,
  ) {
    const lastStage = await db.projectStage.findFirst({
      where: { tenantId, projectId },
      select: { position: true },
      orderBy: { position: 'desc' },
    });

    return (lastStage?.position ?? 0) + 1;
  }

  private async ensureStagePositionAvailable(
    db: PrismaProjectWriteClient,
    tenantId: string,
    projectId: string,
    position: number,
    stageIdToExclude?: string,
  ) {
    const stage = await db.projectStage.findFirst({
      where: {
        tenantId,
        projectId,
        position,
        ...(stageIdToExclude ? { NOT: { id: stageIdToExclude } } : {}),
      },
      select: { id: true },
    });

    if (stage) {
      throw new BadRequestException('Stage position is already in use for this project');
    }
  }

  private async syncProjectProgress(
    db: PrismaProjectWriteClient,
    tenantId: string,
    projectId: string,
  ) {
    const stages = await db.projectStage.findMany({
      where: { tenantId, projectId },
      select: { progressPercent: true, weightPercent: true },
    });

    const progressPercent = this.analyzeProjectProgress(stages).progressPercent;

    await db.project.update({
      where: { id: projectId },
      data: { progressPercent },
    });
  }

  private analyzeProjectProgress(
    stages: Array<{ progressPercent: number; weightPercent: number | null }>,
  ): ProgressAnalysis {
    const alerts: SummaryMessage[] = [];
    const warnings: SummaryMessage[] = [];

    if (stages.length === 0) {
      return { progressPercent: 0, alerts, warnings };
    }

    const weightedStages = stages.filter((stage) => stage.weightPercent !== null);
    if (weightedStages.length > 0 && weightedStages.length !== stages.length) {
      alerts.push({
        code: 'PARTIAL_STAGE_WEIGHTS',
        message: 'Hay etapas con peso definido y otras sin peso.',
        meta: { weightedStages: weightedStages.length, stagesCount: stages.length },
      });
      warnings.push({
        code: 'INCONSISTENT_WEIGHT_CONFIGURATION',
        message: 'La configuracion de pesos es inconsistente; se uso promedio simple.',
      });
    }

    const totalWeight = weightedStages.reduce(
      (sum, stage) => sum + Math.max(0, stage.weightPercent ?? 0),
      0,
    );

    if (weightedStages.length === stages.length && totalWeight !== 100) {
      alerts.push({
        code: 'STAGE_WEIGHTS_SUM_NOT_100',
        message: 'La suma de pesos de las etapas no es 100.',
        meta: { totalWeight },
      });
      warnings.push({
        code: 'INCONSISTENT_WEIGHT_CONFIGURATION',
        message: 'La configuracion de pesos es inconsistente; se uso promedio simple.',
        meta: { totalWeight },
      });
    }

    if (weightedStages.length === stages.length && totalWeight === 100) {
      const weightedProgress = weightedStages.reduce(
        (sum, stage) =>
          sum +
          this.normalizePercent(stage.progressPercent) * Math.max(0, stage.weightPercent ?? 0),
        0,
      );

      return {
        progressPercent: this.normalizePercent(weightedProgress / 100),
        alerts,
        warnings,
      };
    }

    const average =
      stages.reduce((sum, stage) => sum + this.normalizePercent(stage.progressPercent), 0) /
      stages.length;

    return {
      progressPercent: this.normalizePercent(average),
      alerts,
      warnings,
    };
  }

  private async replaceProjectStageTasks(
    db: PrismaProjectWriteClient,
    tenantId: string,
    projectStageId: string,
    tasks: Array<{ title: string; completed: boolean }>,
  ) {
    await db.projectStageTask.deleteMany({
      where: { tenantId, projectStageId },
    });

    if (tasks.length === 0) {
      return;
    }

    await db.projectStageTask.createMany({
      data: tasks.map((task, index) => ({
        tenantId,
        projectStageId,
        title: task.title,
        completed: task.completed,
        position: index + 1,
      })),
    });
  }

  private normalizeProjectStageTasks(
    tasks: Array<{ title: string; completed?: boolean }>,
  ): Array<{ title: string; completed: boolean }> {
    return tasks.map((task, index) => {
      const title = task.title.trim();

      if (!title) {
        throw new BadRequestException(`Task ${index + 1} title is required`);
      }

      if (title.length > 240) {
        throw new BadRequestException(`Task ${index + 1} title must be 240 characters or less`);
      }

      return {
        title,
        completed: task.completed ?? false,
      };
    });
  }

  private calculateStageProgressFromTasks(tasks: Array<{ completed: boolean }>) {
    if (tasks.length === 0) {
      return 0;
    }

    const completedCount = tasks.filter((task) => task.completed).length;
    return this.normalizePercent(Math.round((completedCount / tasks.length) * 100));
  }

  private validateProjectDates(
    startDate: Date | null,
    endDate: Date | null,
    label: 'planned' | 'actual' = 'planned',
  ) {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        label === 'actual'
          ? 'Project actual start date must be before or equal to actual end date'
          : 'Project start date must be before or equal to estimated end date',
      );
    }
  }

  private validateStageDates(
    stage: {
      estimatedStartDate?: Date | null;
      estimatedEndDate?: Date | null;
      actualStartDate?: Date | null;
      actualEndDate?: Date | null;
    },
    _project: {
      startDate?: Date | null;
      estimatedEndDate?: Date | null;
      actualStartDate?: Date | null;
      actualEndDate?: Date | null;
    },
  ) {
    if (
      stage.estimatedStartDate &&
      stage.estimatedEndDate &&
      stage.estimatedStartDate > stage.estimatedEndDate
    ) {
      throw new BadRequestException(
        'Project stage estimated start date must be before or equal to estimated end date',
      );
    }

    if (
      stage.actualStartDate &&
      stage.actualEndDate &&
      stage.actualStartDate > stage.actualEndDate
    ) {
      throw new BadRequestException(
        'Project stage actual start date must be before or equal to actual end date',
      );
    }
  }

  private resolveStageStatusForTaskProgress(
    progressPercent: number,
    requestedStatus?: ProjectStageStatus,
    existingStatus?: ProjectStageStatus,
  ) {
    const normalizedProgress = this.normalizePercent(progressPercent);

    if (normalizedProgress === 100) {
      return ProjectStageStatus.COMPLETED;
    }

    if (requestedStatus === ProjectStageStatus.PAUSED) {
      return ProjectStageStatus.PAUSED;
    }

    if (requestedStatus === undefined && existingStatus === ProjectStageStatus.PAUSED) {
      return ProjectStageStatus.PAUSED;
    }

    if (normalizedProgress === 0) {
      return ProjectStageStatus.PENDING;
    }

    return ProjectStageStatus.IN_PROGRESS;
  }

  private isStageOutsideProjectRange(
    project: {
      startDate: Date | null;
      actualStartDate: Date | null;
      estimatedEndDate: Date | null;
      actualEndDate: Date | null;
    },
    stage: {
      estimatedStartDate: Date | null;
      estimatedEndDate: Date | null;
      actualStartDate: Date | null;
      actualEndDate: Date | null;
    },
  ) {
    const stageDates = [
      { value: stage.estimatedStartDate, min: project.startDate, max: project.estimatedEndDate },
      { value: stage.estimatedEndDate, min: project.startDate, max: project.estimatedEndDate },
      {
        value: stage.actualStartDate,
        min: project.actualStartDate ?? project.startDate,
        max: project.actualEndDate ?? project.estimatedEndDate,
      },
      {
        value: stage.actualEndDate,
        min: project.actualStartDate ?? project.startDate,
        max: project.actualEndDate ?? project.estimatedEndDate,
      },
    ];

    return stageDates.some(({ value, min, max }) => {
      if (!value) {
        return false;
      }

      if (min && value < min) {
        return true;
      }

      if (max && value > max) {
        return true;
      }

      return false;
    });
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }

  private requireTrimmedString(value: string, message: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizePercent(value: number) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
}
