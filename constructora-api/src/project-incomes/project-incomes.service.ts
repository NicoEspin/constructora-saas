import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectIncomeStatus } from '@prisma/client';
import { AttachmentsService } from '../attachments/attachments.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import {
  buildMonthlySummary,
  getMonthRanges,
  type MonthlyAmountSummary,
} from '../common/monthly-summary.util';
import { CreateProjectIncomeDto } from './dto/create-project-income.dto';
import { ListProjectIncomesQueryDto } from './dto/list-project-incomes-query.dto';
import { UpdateProjectIncomeDto } from './dto/update-project-income.dto';

const projectIncomeAttachmentSelect = {
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
} satisfies Prisma.AttachmentSelect;

const projectIncomeInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  budget: {
    select: {
      id: true,
      name: true,
      status: true,
      projectId: true,
    },
  },
  attachments: {
    select: projectIncomeAttachmentSelect,
    orderBy: [{ createdAt: 'desc' as const }],
  },
} satisfies Prisma.ProjectIncomeInclude;

@Injectable()
export class ProjectIncomesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async create(tenantId: string, dto: CreateProjectIncomeDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.validateReferences(tenantId, dto.projectId, dto.budgetId ?? null);

    const income = await this.prisma.projectIncome.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        budgetId: dto.budgetId ?? null,
        receivedAt: dto.receivedAt ?? new Date(),
        amount: this.normalizeAmount(dto.amount),
        status: dto.status ?? ProjectIncomeStatus.CONFIRMED,
        description: this.normalizeOptionalString(dto.description),
        paymentMethod: dto.paymentMethod ?? null,
        reference: this.normalizeOptionalString(dto.reference),
        notes: this.normalizeOptionalString(dto.notes),
      },
      include: projectIncomeInclude,
    });

    await this.auditService.log({
      action: 'project-income.create',
      entity: 'project-income',
      entityId: income.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: income.projectId,
        budgetId: income.budgetId,
        amount: income.amount.toString(),
        status: income.status,
        paymentMethod: income.paymentMethod,
      },
    });

    return income;
  }

  async findAll(tenantId: string, query: ListProjectIncomesQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ProjectIncomeWhereInput = {
      tenantId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
              { project: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.projectIncome.findMany({
        where,
        include: projectIncomeInclude,
        orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.projectIncome.count({ where }),
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
    return this.findIncomeOrThrow(tenantId, id);
  }

  async getMonthlySummary(tenantId: string): Promise<MonthlyAmountSummary> {
    this.assertTenantId(tenantId);

    const { currentStart, previousStart, previousEnd } = getMonthRanges();
    const confirmedStatus = ProjectIncomeStatus.CONFIRMED;

    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.projectIncome.aggregate({
        where: { tenantId, status: confirmedStatus, receivedAt: { gte: currentStart } },
        _sum: { amount: true },
      }),
      this.prisma.projectIncome.aggregate({
        where: {
          tenantId,
          status: confirmedStatus,
          receivedAt: { gte: previousStart, lt: previousEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    return buildMonthlySummary(currentAgg._sum.amount, previousAgg._sum.amount);
  }

  async update(tenantId: string, id: string, dto: UpdateProjectIncomeDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findIncomeOrThrow(tenantId, id);
    const projectId = dto.projectId ?? existing.projectId;
    const budgetId = dto.budgetId !== undefined ? dto.budgetId : existing.budgetId;
    await this.validateReferences(tenantId, projectId, budgetId ?? null);

    const income = await this.prisma.projectIncome.update({
      where: { id },
      data: {
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.budgetId !== undefined ? { budgetId: dto.budgetId ?? null } : {}),
        ...(dto.receivedAt !== undefined ? { receivedAt: dto.receivedAt } : {}),
        ...(dto.amount !== undefined ? { amount: this.normalizeAmount(dto.amount) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined
          ? { description: this.normalizeOptionalString(dto.description) }
          : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod ?? null } : {}),
        ...(dto.reference !== undefined
          ? { reference: this.normalizeOptionalString(dto.reference) }
          : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
      },
      include: projectIncomeInclude,
    });

    await this.auditService.log({
      action: 'project-income.update',
      entity: 'project-income',
      entityId: income.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: income.projectId,
        budgetId: income.budgetId,
        amount: income.amount.toString(),
        status: income.status,
        paymentMethod: income.paymentMethod,
      },
    });

    return income;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findIncomeOrThrow(tenantId, id);
    await this.attachmentsService.deleteProjectIncomeAttachments(
      tenantId,
      existing.id,
      actorUserId,
    );
    await this.prisma.projectIncome.delete({ where: { id } });

    await this.auditService.log({
      action: 'project-income.delete',
      entity: 'project-income',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: existing.projectId,
        amount: existing.amount.toString(),
      },
    });

    return { success: true };
  }

  private async findIncomeOrThrow(tenantId: string, id: string) {
    const income = await this.prisma.projectIncome.findFirst({
      where: { id, tenantId },
      include: projectIncomeInclude,
    });

    if (!income) {
      throw new NotFoundException('Project income not found');
    }

    return income;
  }

  private async validateReferences(tenantId: string, projectId: string, budgetId: string | null) {
    const [project, budget] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      }),
      budgetId
        ? this.prisma.budget.findFirst({
            where: { id: budgetId, tenantId },
            select: { id: true, projectId: true },
          })
        : Promise.resolve(null),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (budgetId && !budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget && budget.projectId && budget.projectId !== projectId) {
      throw new BadRequestException('Budget does not belong to the provided project');
    }
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }

  private normalizeAmount(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Income amount must be greater than zero');
    }

    return new Prisma.Decimal(value.toFixed(2));
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
