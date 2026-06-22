import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials-query.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

const materialInclude = {
  supplier: {
    select: {
      id: true,
      name: true,
      trade: true,
    },
  },
} satisfies Prisma.MaterialInclude;

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateMaterialDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.assertSupplierBelongsToTenant(tenantId, dto.supplierId ?? null);

    const estimatedUnitPrice = this.normalizeMoney(dto.estimatedUnitPrice);
    const material = await this.prisma.material.create({
      data: {
        tenantId,
        name: this.requireTrimmedString(dto.name, 'Material name is required'),
        category: this.normalizeOptionalString(dto.category),
        unit: dto.unit,
        supplierId: dto.supplierId ?? null,
        estimatedUnitPrice,
        lastPriceUpdatedAt: estimatedUnitPrice ? new Date() : null,
        notes: this.normalizeOptionalString(dto.notes),
      },
      include: materialInclude,
    });

    await this.auditService.log({
      action: 'material.create',
      entity: 'material',
      entityId: material.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        name: material.name,
        supplierId: material.supplierId,
        estimatedUnitPrice: material.estimatedUnitPrice?.toString() ?? null,
      },
    });

    return material;
  }

  async findAll(tenantId: string, query: ListMaterialsQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.MaterialWhereInput = {
      tenantId,
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        include: materialInclude,
        orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
        skip,
        take,
      }),
      this.prisma.material.count({ where }),
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
    return this.findMaterialOrThrow(tenantId, id);
  }

  async update(tenantId: string, id: string, dto: UpdateMaterialDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findMaterialOrThrow(tenantId, id);
    const resolvedSupplierId = dto.supplierId !== undefined ? dto.supplierId : existing.supplierId;
    await this.assertSupplierBelongsToTenant(tenantId, resolvedSupplierId ?? null);

    const normalizedEstimatedUnitPrice =
      dto.estimatedUnitPrice !== undefined
        ? this.normalizeMoney(dto.estimatedUnitPrice)
        : existing.estimatedUnitPrice;

    const estimatedPriceChanged = this.hasEstimatedPriceChanged(
      existing.estimatedUnitPrice,
      normalizedEstimatedUnitPrice,
    );

    const material = await this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.name !== undefined
          ? { name: this.requireTrimmedString(dto.name, 'Material name is required') }
          : {}),
        ...(dto.category !== undefined
          ? { category: this.normalizeOptionalString(dto.category) }
          : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId ?? null } : {}),
        ...(dto.estimatedUnitPrice !== undefined
          ? {
              estimatedUnitPrice: normalizedEstimatedUnitPrice,
              lastPriceUpdatedAt: estimatedPriceChanged ? new Date() : existing.lastPriceUpdatedAt,
            }
          : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
      },
      include: materialInclude,
    });

    await this.auditService.log({
      action: 'material.update',
      entity: 'material',
      entityId: material.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        name: material.name,
        supplierId: material.supplierId,
        estimatedUnitPrice: material.estimatedUnitPrice?.toString() ?? null,
      },
    });

    return material;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findMaterialOrThrow(tenantId, id);
    const budgetItemsCount = await this.prisma.budgetItem.count({
      where: { tenantId, materialId: id },
    });

    if (budgetItemsCount > 0) {
      throw new BadRequestException('Material cannot be deleted while it is used in budget items');
    }

    await this.prisma.material.delete({ where: { id } });

    await this.auditService.log({
      action: 'material.delete',
      entity: 'material',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        name: existing.name,
        supplierId: existing.supplierId,
      },
    });

    return { success: true };
  }

  private async findMaterialOrThrow(tenantId: string, id: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, tenantId },
      include: materialInclude,
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  private async assertSupplierBelongsToTenant(tenantId: string, supplierId: string | null) {
    if (!supplierId) {
      return;
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, tenantId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
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

  private normalizeMoney(value?: number | null) {
    if (value === undefined || value === null) {
      return null;
    }

    return new Prisma.Decimal(value.toFixed(2));
  }

  private hasEstimatedPriceChanged(previous: Prisma.Decimal | null, next: Prisma.Decimal | null) {
    const previousValue = previous?.toString() ?? null;
    const nextValue = next?.toString() ?? null;
    return previousValue !== nextValue;
  }
}
