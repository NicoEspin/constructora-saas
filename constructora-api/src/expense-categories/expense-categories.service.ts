import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ListExpenseCategoriesQueryDto } from './dto/list-expense-categories-query.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateExpenseCategoryDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const normalizedName = this.requireTrimmedString(dto.name, 'Expense category name is required');
    await this.ensureCategoryNameAvailable(tenantId, normalizedName);

    const category = await this.prisma.expenseCategory.create({
      data: {
        tenantId,
        name: normalizedName,
        description: this.normalizeOptionalString(dto.description),
        color: this.normalizeOptionalString(dto.color),
      },
    });

    await this.auditService.log({
      action: 'expense-category.create',
      entity: 'expense-category',
      entityId: category.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: category.name },
    });

    return category;
  }

  async findAll(tenantId: string, query: ListExpenseCategoriesQueryDto) {
    this.assertTenantId(tenantId);

    const search = query.search?.trim();
    const where: Prisma.ExpenseCategoryWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.expenseCategory.findMany({
      where,
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(tenantId: string, id: string, dto: UpdateExpenseCategoryDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findCategoryOrThrow(tenantId, id);

    if (dto.name !== undefined) {
      const normalizedName = this.requireTrimmedString(
        dto.name,
        'Expense category name is required',
      );
      await this.ensureCategoryNameAvailable(tenantId, normalizedName, id);
    }

    const category = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined
          ? { name: this.requireTrimmedString(dto.name, 'Expense category name is required') }
          : {}),
        ...(dto.description !== undefined
          ? { description: this.normalizeOptionalString(dto.description) }
          : {}),
        ...(dto.color !== undefined ? { color: this.normalizeOptionalString(dto.color) } : {}),
      },
    });

    await this.auditService.log({
      action: 'expense-category.update',
      entity: 'expense-category',
      entityId: category.id,
      tenantId,
      userId: actorUserId,
      metadata: { fromName: existing.name, toName: category.name },
    });

    return category;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findCategoryOrThrow(tenantId, id);
    const expensesCount = await this.prisma.expense.count({
      where: { tenantId, categoryId: id },
    });

    if (expensesCount > 0) {
      throw new BadRequestException('Expense category cannot be deleted while it has expenses');
    }

    await this.prisma.expenseCategory.delete({ where: { id } });

    await this.auditService.log({
      action: 'expense-category.delete',
      entity: 'expense-category',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name },
    });

    return { success: true };
  }

  private async findCategoryOrThrow(tenantId: string, id: string) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Expense category not found');
    }

    return category;
  }

  private async ensureCategoryNameAvailable(tenantId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: {
        tenantId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Expense category already exists');
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
}
