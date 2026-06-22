import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateClientDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const client = await this.prisma.client.create({
      data: {
        tenantId,
        ...this.normalizeCreateInput(dto),
      },
    });

    await this.auditService.log({
      action: 'client.create',
      entity: 'client',
      entityId: client.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: client.name },
    });

    return client;
  }

  async findAll(tenantId: string, query: ListClientsQueryDto) {
    this.assertTenantId(tenantId);
    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ClientWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { taxId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.client.count({ where }),
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

    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: this.normalizeUpdateInput(dto),
    });

    await this.auditService.log({
      action: 'client.update',
      entity: 'client',
      entityId: client.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: client.name },
    });

    return client;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.client.delete({ where: { id } });

    await this.auditService.log({
      action: 'client.delete',
      entity: 'client',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name },
    });

    return { success: true };
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }

  private normalizeCreateInput(dto: CreateClientDto) {
    return {
      name: dto.name.trim(),
      phone: this.normalizeOptionalString(dto.phone),
      email: dto.email?.trim().toLowerCase() || undefined,
      address: this.normalizeOptionalString(dto.address),
      taxId: this.normalizeOptionalString(dto.taxId),
      notes: this.normalizeOptionalString(dto.notes),
    };
  }

  private normalizeUpdateInput(dto: UpdateClientDto) {
    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: this.normalizeOptionalString(dto.phone) } : {}),
      ...(dto.email !== undefined ? { email: dto.email?.trim().toLowerCase() || null } : {}),
      ...(dto.address !== undefined ? { address: this.normalizeOptionalString(dto.address) } : {}),
      ...(dto.taxId !== undefined ? { taxId: this.normalizeOptionalString(dto.taxId) } : {}),
      ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
    };
  }

  private normalizeOptionalString(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
