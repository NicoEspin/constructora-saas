import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateSupplierDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId,
        ...this.normalizeCreateInput(dto),
      },
    });

    await this.auditService.log({
      action: 'supplier.create',
      entity: 'supplier',
      entityId: supplier.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: supplier.name },
    });

    return supplier;
  }

  async findAll(tenantId: string, query: ListSuppliersQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { trade: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { taxId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
        skip,
        take,
      }),
      this.prisma.supplier.count({ where }),
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
    return this.findSupplierOrThrow(tenantId, id);
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findSupplierOrThrow(tenantId, id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: this.normalizeUpdateInput(dto),
    });

    await this.auditService.log({
      action: 'supplier.update',
      entity: 'supplier',
      entityId: supplier.id,
      tenantId,
      userId: actorUserId,
      metadata: { fromName: existing.name, toName: supplier.name },
    });

    return supplier;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findSupplierOrThrow(tenantId, id);
    const [expensesCount, materialsCount] = await Promise.all([
      this.prisma.expense.count({ where: { tenantId, supplierId: id } }),
      this.prisma.material.count({ where: { tenantId, supplierId: id } }),
    ]);

    if (expensesCount > 0 || materialsCount > 0) {
      throw new BadRequestException(
        'Supplier cannot be deleted while it has related expenses or materials',
      );
    }

    await this.prisma.supplier.delete({ where: { id } });

    await this.auditService.log({
      action: 'supplier.delete',
      entity: 'supplier',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name },
    });

    return { success: true };
  }

  private async findSupplierOrThrow(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
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

  private normalizeCreateInput(dto: CreateSupplierDto) {
    return {
      name: this.requireTrimmedString(dto.name, 'Supplier name is required'),
      trade: this.normalizeOptionalString(dto.trade),
      phone: this.normalizeOptionalString(dto.phone),
      email: dto.email?.trim().toLowerCase() || undefined,
      address: this.normalizeOptionalString(dto.address),
      taxId: this.normalizeOptionalString(dto.taxId),
      offerings: this.normalizeOptionalString(dto.offerings),
      notes: this.normalizeOptionalString(dto.notes),
    };
  }

  private normalizeUpdateInput(dto: UpdateSupplierDto) {
    return {
      ...(dto.name !== undefined
        ? { name: this.requireTrimmedString(dto.name, 'Supplier name is required') }
        : {}),
      ...(dto.trade !== undefined ? { trade: this.normalizeOptionalString(dto.trade) } : {}),
      ...(dto.phone !== undefined ? { phone: this.normalizeOptionalString(dto.phone) } : {}),
      ...(dto.email !== undefined ? { email: dto.email?.trim().toLowerCase() || null } : {}),
      ...(dto.address !== undefined ? { address: this.normalizeOptionalString(dto.address) } : {}),
      ...(dto.taxId !== undefined ? { taxId: this.normalizeOptionalString(dto.taxId) } : {}),
      ...(dto.offerings !== undefined
        ? { offerings: this.normalizeOptionalString(dto.offerings) }
        : {}),
      ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
    };
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
