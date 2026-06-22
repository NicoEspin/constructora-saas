import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { ListBudgetsQueryDto } from './dto/list-budgets-query.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateBudgetStatusDto } from './dto/update-budget-status.dto';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';

const budgetDetailsInclude = {
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  items: {
    orderBy: {
      position: 'asc' as const,
    },
  },
} satisfies Prisma.BudgetInclude;

const budgetListInclude = {
  client: {
    select: {
      id: true,
      name: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.BudgetInclude;

const allowedStatusTransitions: Record<BudgetStatus, BudgetStatus[]> = {
  DRAFT: [BudgetStatus.SENT, BudgetStatus.APPROVED, BudgetStatus.REJECTED, BudgetStatus.EXPIRED],
  SENT: [BudgetStatus.APPROVED, BudgetStatus.REJECTED, BudgetStatus.EXPIRED],
  APPROVED: [],
  REJECTED: [BudgetStatus.DRAFT],
  EXPIRED: [BudgetStatus.DRAFT],
};

type NormalizedBudgetItem = {
  tenantId: string;
  materialId: string | null;
  category: CreateBudgetItemDto['category'];
  name: string;
  description: string | null;
  quantity: Prisma.Decimal;
  unit: CreateBudgetItemDto['unit'];
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  position: number;
};

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateBudgetDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.validateReferences(tenantId, dto.clientId, dto.projectId ?? null, dto.items ?? []);

    const normalizedItems = this.normalizeItems(tenantId, dto.items ?? []);
    const amounts = this.calculateAmounts(normalizedItems, dto);

    const budget = await this.prisma.$transaction(async (tx) => {
      const createdBudget = await tx.budget.create({
        data: {
          tenantId,
          clientId: dto.clientId,
          projectId: dto.projectId ?? null,
          name: this.requireTrimmedString(dto.name, 'Budget name is required'),
          workType: this.normalizeOptionalString(dto.workType),
          description: this.normalizeOptionalString(dto.description),
          issuedAt: dto.issuedAt ?? new Date(),
          expiresAt: dto.expiresAt ?? null,
          commercialTerms: this.normalizeOptionalString(dto.commercialTerms),
          paymentTerms: this.normalizeOptionalString(dto.paymentTerms),
          estimatedExecutionTime: this.normalizeOptionalString(dto.estimatedExecutionTime),
          subtotalAmount: amounts.subtotalAmount,
          discountAmount: amounts.discountAmount,
          taxAmount: amounts.taxAmount,
          profitAmount: amounts.profitAmount,
          totalAmount: amounts.totalAmount,
        },
      });

      if (normalizedItems.length > 0) {
        await tx.budgetItem.createMany({
          data: normalizedItems.map((item) => ({
            budgetId: createdBudget.id,
            ...item,
          })),
        });
      }

      return tx.budget.findUniqueOrThrow({
        where: { id: createdBudget.id },
        include: budgetDetailsInclude,
      });
    });

    await this.auditService.log({
      action: 'budget.create',
      entity: 'budget',
      entityId: budget.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: budget.name, status: budget.status },
    });

    return budget;
  }

  async findAll(tenantId: string, query: ListBudgetsQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.BudgetWhereInput = {
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
      this.prisma.budget.findMany({
        where,
        include: budgetListInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.budget.count({ where }),
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
    return this.findBudgetOrThrow(tenantId, id);
  }

  async update(tenantId: string, id: string, dto: UpdateBudgetDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findBudgetOrThrow(tenantId, id);
    const resolvedClientId = dto.clientId ?? existing.clientId;
    const resolvedProjectId = dto.projectId !== undefined ? dto.projectId : existing.projectId;
    const normalizedItems =
      dto.items !== undefined ? this.normalizeItems(tenantId, dto.items) : null;

    await this.validateReferences(
      tenantId,
      resolvedClientId,
      resolvedProjectId ?? null,
      dto.items ?? existing.items,
    );

    const amounts = this.calculateAmounts(normalizedItems ?? existing.items, {
      discountAmount: dto.discountAmount ?? existing.discountAmount,
      taxAmount: dto.taxAmount ?? existing.taxAmount,
      profitAmount: dto.profitAmount ?? existing.profitAmount,
    });

    const budget = await this.prisma.$transaction(async (tx) => {
      await tx.budget.update({
        where: { id },
        data: {
          ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
          ...(dto.projectId !== undefined ? { projectId: dto.projectId ?? null } : {}),
          ...(dto.name !== undefined
            ? { name: this.requireTrimmedString(dto.name, 'Budget name is required') }
            : {}),
          ...(dto.workType !== undefined
            ? { workType: this.normalizeOptionalString(dto.workType) }
            : {}),
          ...(dto.description !== undefined
            ? { description: this.normalizeOptionalString(dto.description) }
            : {}),
          ...(dto.issuedAt !== undefined ? { issuedAt: dto.issuedAt } : {}),
          ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ?? null } : {}),
          ...(dto.commercialTerms !== undefined
            ? { commercialTerms: this.normalizeOptionalString(dto.commercialTerms) }
            : {}),
          ...(dto.paymentTerms !== undefined
            ? { paymentTerms: this.normalizeOptionalString(dto.paymentTerms) }
            : {}),
          ...(dto.estimatedExecutionTime !== undefined
            ? { estimatedExecutionTime: this.normalizeOptionalString(dto.estimatedExecutionTime) }
            : {}),
          subtotalAmount: amounts.subtotalAmount,
          discountAmount: amounts.discountAmount,
          taxAmount: amounts.taxAmount,
          profitAmount: amounts.profitAmount,
          totalAmount: amounts.totalAmount,
        },
      });

      if (normalizedItems !== null) {
        await tx.budgetItem.deleteMany({ where: { budgetId: id } });

        if (normalizedItems.length > 0) {
          await tx.budgetItem.createMany({
            data: normalizedItems.map((item) => ({
              budgetId: id,
              ...item,
            })),
          });
        }
      }

      return tx.budget.findUniqueOrThrow({
        where: { id },
        include: budgetDetailsInclude,
      });
    });

    await this.auditService.log({
      action: 'budget.update',
      entity: 'budget',
      entityId: budget.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: budget.name, status: budget.status },
    });

    return budget;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateBudgetStatusDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    const existing = await this.findBudgetOrThrow(tenantId, id);
    this.assertStatusTransition(existing.status, dto.status);

    const budget = await this.prisma.budget.update({
      where: { id },
      data: { status: dto.status },
      include: budgetDetailsInclude,
    });

    await this.auditService.log({
      action: 'budget.status',
      entity: 'budget',
      entityId: budget.id,
      tenantId,
      userId: actorUserId,
      metadata: { from: existing.status, to: budget.status, name: budget.name },
    });

    return budget;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findBudgetOrThrow(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.budgetItem.deleteMany({ where: { budgetId: id } });
      await tx.budget.delete({ where: { id } });
    });

    await this.auditService.log({
      action: 'budget.delete',
      entity: 'budget',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name, status: existing.status },
    });

    return { success: true };
  }

  private async findBudgetOrThrow(tenantId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, tenantId },
      include: budgetDetailsInclude,
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  private async validateReferences(
    tenantId: string,
    clientId: string,
    projectId: string | null,
    items: Array<{ materialId?: string | null }>,
  ) {
    const [client, project] = await Promise.all([
      this.prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } }),
      projectId
        ? this.prisma.project.findFirst({
            where: { id: projectId, tenantId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (projectId && !project) {
      throw new NotFoundException('Project not found');
    }

    const materialIds = [
      ...new Set(items.map((item) => item.materialId).filter(Boolean)),
    ] as string[];
    if (materialIds.length === 0) {
      return;
    }

    const materials = await this.prisma.material.findMany({
      where: {
        tenantId,
        id: { in: materialIds },
      },
      select: { id: true },
    });

    if (materials.length !== materialIds.length) {
      throw new NotFoundException('One or more materials were not found');
    }
  }

  private normalizeItems(tenantId: string, items: CreateBudgetItemDto[]): NormalizedBudgetItem[] {
    return items.map((item, index) => {
      const quantity = this.toMoneyDecimal(item.quantity);
      const unitPrice = this.toMoneyDecimal(item.unitPrice);

      return {
        tenantId,
        materialId: item.materialId ?? null,
        category: item.category,
        name: this.requireTrimmedString(item.name, 'Budget item name is required'),
        description: this.normalizeOptionalString(item.description),
        quantity,
        unit: item.unit,
        unitPrice,
        subtotal: quantity.mul(unitPrice).toDecimalPlaces(2),
        position: index + 1,
      };
    });
  }

  private calculateAmounts(
    items: Array<{
      quantity?: Prisma.Decimal;
      unitPrice?: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>,
    input: {
      discountAmount?: number | string | Prisma.Decimal | null;
      taxAmount?: number | string | Prisma.Decimal | null;
      profitAmount?: number | string | Prisma.Decimal | null;
    },
  ) {
    const subtotalAmount = items.reduce(
      (accumulator, item) => accumulator.plus(this.toMoneyDecimal(item.subtotal)),
      new Prisma.Decimal(0),
    );
    const discountAmount = this.toMoneyDecimal(input.discountAmount ?? 0);
    const taxAmount = this.toMoneyDecimal(input.taxAmount ?? 0);
    const profitAmount = this.toMoneyDecimal(input.profitAmount ?? 0);
    const totalAmount = subtotalAmount.minus(discountAmount).plus(taxAmount).plus(profitAmount);

    if (totalAmount.lessThan(0)) {
      throw new BadRequestException('Budget total amount cannot be negative');
    }

    return {
      subtotalAmount: subtotalAmount.toDecimalPlaces(2),
      discountAmount: discountAmount.toDecimalPlaces(2),
      taxAmount: taxAmount.toDecimalPlaces(2),
      profitAmount: profitAmount.toDecimalPlaces(2),
      totalAmount: totalAmount.toDecimalPlaces(2),
    };
  }

  private assertStatusTransition(currentStatus: BudgetStatus, nextStatus: BudgetStatus) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid budget status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
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

  private toMoneyDecimal(value: number | string | Prisma.Decimal) {
    return new Prisma.Decimal(value).toDecimalPlaces(2);
  }
}
