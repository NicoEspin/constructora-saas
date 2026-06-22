import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { PrismaService } from '../common/prisma.service';
import {
  buildMonthlySummary,
  getMonthRanges,
  type MonthlyAmountSummary,
} from '../common/monthly-summary.util';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const expenseInclude = {
  category: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  projectStage: {
    select: {
      id: true,
      name: true,
      status: true,
      projectId: true,
      position: true,
    },
  },
  supplier: {
    select: {
      id: true,
      name: true,
      trade: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
  attachments: {
    select: {
      id: true,
      fileName: true,
      kind: true,
      mimeType: true,
      fileSizeBytes: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ExpenseInclude;

type ResolvedReferences = {
  categoryId: string;
  projectId: string | null;
  projectStageId: string | null;
  supplierId: string | null;
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async create(tenantId: string, dto: CreateExpenseDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const references = await this.validateAndResolveReferences(tenantId, {
      categoryId: dto.categoryId,
      projectId: dto.projectId ?? null,
      projectStageId: dto.projectStageId ?? null,
      supplierId: dto.supplierId ?? null,
    });

    const expense = await this.prisma.expense.create({
      data: {
        tenantId,
        ...references,
        createdByUserId: actorUserId,
        expenseDate: dto.expenseDate ?? new Date(),
        dueDate: dto.dueDate ?? null,
        amount: this.normalizeAmount(dto.amount),
        description: this.normalizeOptionalString(dto.description),
        paymentMethod: dto.paymentMethod ?? null,
        status: dto.status ?? ExpenseStatus.PENDING,
      },
      include: expenseInclude,
    });

    await this.auditService.log({
      action: 'expense.create',
      entity: 'expense',
      entityId: expense.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        amount: expense.amount.toString(),
        status: expense.status,
        categoryId: expense.categoryId,
        projectId: expense.projectId,
      },
    });

    return expense;
  }

  async findAll(tenantId: string, query: ListExpensesQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ExpenseWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.projectStageId ? { projectStageId: query.projectStageId } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { category: { name: { contains: search, mode: 'insensitive' } } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
              { project: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.expense.count({ where }),
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
    return this.findExpenseOrThrow(tenantId, id);
  }

  async getMonthlySummary(tenantId: string): Promise<MonthlyAmountSummary> {
    this.assertTenantId(tenantId);

    const { currentStart, previousStart, previousEnd } = getMonthRanges();
    const recordedStatus: Prisma.ExpenseWhereInput = { status: { not: ExpenseStatus.CANCELLED } };

    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { tenantId, ...recordedStatus, expenseDate: { gte: currentStart } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          tenantId,
          ...recordedStatus,
          expenseDate: { gte: previousStart, lt: previousEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    return buildMonthlySummary(currentAgg._sum.amount, previousAgg._sum.amount);
  }

  async update(tenantId: string, id: string, dto: UpdateExpenseDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findExpenseOrThrow(tenantId, id);
    const resolvedProjectId = dto.projectId !== undefined ? dto.projectId : existing.projectId;
    const resolvedProjectStageId =
      dto.projectStageId !== undefined
        ? dto.projectStageId
        : dto.projectId !== undefined && dto.projectId !== existing.projectId
          ? null
          : existing.projectStageId;

    const references = await this.validateAndResolveReferences(tenantId, {
      categoryId: dto.categoryId ?? existing.categoryId,
      projectId: resolvedProjectId,
      projectStageId: resolvedProjectStageId,
      supplierId: dto.supplierId !== undefined ? dto.supplierId : existing.supplierId,
    });

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...references,
        ...(dto.expenseDate !== undefined ? { expenseDate: dto.expenseDate } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ?? null } : {}),
        ...(dto.amount !== undefined ? { amount: this.normalizeAmount(dto.amount) } : {}),
        ...(dto.description !== undefined
          ? { description: this.normalizeOptionalString(dto.description) }
          : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: expenseInclude,
    });

    await this.auditService.log({
      action: 'expense.update',
      entity: 'expense',
      entityId: expense.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        amount: expense.amount.toString(),
        status: expense.status,
        categoryId: expense.categoryId,
        projectId: expense.projectId,
      },
    });

    return expense;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateExpenseStatusDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    const existing = await this.findExpenseOrThrow(tenantId, id);
    const expense = await this.prisma.expense.update({
      where: { id },
      data: { status: dto.status },
      include: expenseInclude,
    });

    await this.auditService.log({
      action: 'expense.status',
      entity: 'expense',
      entityId: expense.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        from: existing.status,
        to: expense.status,
        amount: expense.amount.toString(),
      },
    });

    return expense;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findExpenseOrThrow(tenantId, id);
    await this.attachmentsService.deleteExpenseAttachments(tenantId, id, actorUserId);
    await this.prisma.expense.delete({ where: { id } });

    await this.auditService.log({
      action: 'expense.delete',
      entity: 'expense',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        amount: existing.amount.toString(),
        status: existing.status,
        categoryId: existing.categoryId,
        projectId: existing.projectId,
      },
    });

    return { success: true };
  }

  private async findExpenseOrThrow(tenantId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
      include: expenseInclude,
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  private async validateAndResolveReferences(
    tenantId: string,
    refs: {
      categoryId: string;
      projectId: string | null;
      projectStageId: string | null;
      supplierId: string | null;
    },
  ): Promise<ResolvedReferences> {
    const [category, stage, supplier] = await Promise.all([
      this.prisma.expenseCategory.findFirst({
        where: { id: refs.categoryId, tenantId },
        select: { id: true },
      }),
      refs.projectStageId
        ? this.prisma.projectStage.findFirst({
            where: { id: refs.projectStageId, tenantId },
            select: { id: true, projectId: true },
          })
        : Promise.resolve(null),
      refs.supplierId
        ? this.prisma.supplier.findFirst({
            where: { id: refs.supplierId, tenantId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!category) {
      throw new NotFoundException('Expense category not found');
    }

    if (refs.projectStageId && !stage) {
      throw new NotFoundException('Project stage not found');
    }

    if (refs.supplierId && !supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const resolvedProjectId = refs.projectId ?? stage?.projectId ?? null;
    const project = resolvedProjectId
      ? await this.prisma.project.findFirst({
          where: { id: resolvedProjectId, tenantId },
          select: { id: true },
        })
      : null;

    if (resolvedProjectId && !project) {
      throw new NotFoundException('Project not found');
    }

    if (stage && resolvedProjectId && stage.projectId !== resolvedProjectId) {
      throw new BadRequestException('Project stage does not belong to the provided project');
    }

    return {
      categoryId: refs.categoryId,
      projectId: resolvedProjectId,
      projectStageId: refs.projectStageId,
      supplierId: refs.supplierId,
    };
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }

  private normalizeAmount(value: number) {
    return new Prisma.Decimal(value.toFixed(2));
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
