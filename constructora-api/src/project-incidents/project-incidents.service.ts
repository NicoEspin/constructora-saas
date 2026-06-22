import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { CreateProjectIncidentDto } from './dto/create-project-incident.dto';
import { ListProjectIncidentsQueryDto } from './dto/list-project-incidents-query.dto';
import { UpdateProjectIncidentDto } from './dto/update-project-incident.dto';

const projectIncidentInclude = {
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
      projectId: true,
      status: true,
      position: true,
    },
  },
} satisfies Prisma.ProjectIncidentInclude;

@Injectable()
export class ProjectIncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateProjectIncidentDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.validateReferences(tenantId, dto.projectId, dto.projectStageId ?? null);

    const incident = await this.prisma.projectIncident.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        projectStageId: dto.projectStageId ?? null,
        incidentDate: dto.incidentDate ?? new Date(),
        reason: this.requireTrimmedString(dto.reason, 'Incident reason is required'),
        category: dto.category ?? null,
        delayDays: this.normalizeDelayDays(dto.delayDays ?? 0),
        delayHours: this.normalizeDelayHours(dto.delayHours ?? 0),
        notes: this.normalizeOptionalString(dto.notes),
      },
      include: projectIncidentInclude,
    });

    await this.auditService.log({
      action: 'project-incident.create',
      entity: 'project-incident',
      entityId: incident.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: incident.projectId,
        projectStageId: incident.projectStageId,
        category: incident.category,
        delayDays: incident.delayDays,
        delayHours: incident.delayHours,
      },
    });

    return incident;
  }

  async findAll(tenantId: string, query: ListProjectIncidentsQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ProjectIncidentWhereInput = {
      tenantId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(search
        ? {
            OR: [
              { reason: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              { project: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.projectIncident.findMany({
        where,
        include: projectIncidentInclude,
        orderBy: [{ incidentDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.projectIncident.count({ where }),
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
    return this.findIncidentOrThrow(tenantId, id);
  }

  async update(tenantId: string, id: string, dto: UpdateProjectIncidentDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findIncidentOrThrow(tenantId, id);
    const projectId = dto.projectId ?? existing.projectId;
    const projectStageId =
      dto.projectStageId !== undefined ? dto.projectStageId : existing.projectStageId;
    await this.validateReferences(tenantId, projectId, projectStageId ?? null);

    const incident = await this.prisma.projectIncident.update({
      where: { id },
      data: {
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.projectStageId !== undefined ? { projectStageId: dto.projectStageId ?? null } : {}),
        ...(dto.incidentDate !== undefined ? { incidentDate: dto.incidentDate } : {}),
        ...(dto.reason !== undefined
          ? { reason: this.requireTrimmedString(dto.reason, 'Incident reason is required') }
          : {}),
        ...(dto.category !== undefined ? { category: dto.category ?? null } : {}),
        ...(dto.delayDays !== undefined
          ? { delayDays: this.normalizeDelayDays(dto.delayDays) }
          : {}),
        ...(dto.delayHours !== undefined
          ? { delayHours: this.normalizeDelayHours(dto.delayHours) }
          : {}),
        ...(dto.notes !== undefined ? { notes: this.normalizeOptionalString(dto.notes) } : {}),
      },
      include: projectIncidentInclude,
    });

    await this.auditService.log({
      action: 'project-incident.update',
      entity: 'project-incident',
      entityId: incident.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: incident.projectId,
        projectStageId: incident.projectStageId,
        category: incident.category,
        delayDays: incident.delayDays,
        delayHours: incident.delayHours,
      },
    });

    return incident;
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findIncidentOrThrow(tenantId, id);
    await this.prisma.projectIncident.delete({ where: { id } });

    await this.auditService.log({
      action: 'project-incident.delete',
      entity: 'project-incident',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectId: existing.projectId,
        delayDays: existing.delayDays,
        delayHours: existing.delayHours,
      },
    });

    return { success: true };
  }

  private async findIncidentOrThrow(tenantId: string, id: string) {
    const incident = await this.prisma.projectIncident.findFirst({
      where: { id, tenantId },
      include: projectIncidentInclude,
    });

    if (!incident) {
      throw new NotFoundException('Project incident not found');
    }

    return incident;
  }

  private async validateReferences(
    tenantId: string,
    projectId: string,
    projectStageId: string | null,
  ) {
    const [project, stage] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      }),
      projectStageId
        ? this.prisma.projectStage.findFirst({
            where: { id: projectStageId, tenantId },
            select: { id: true, projectId: true },
          })
        : Promise.resolve(null),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (projectStageId && !stage) {
      throw new NotFoundException('Project stage not found');
    }

    if (stage && stage.projectId !== projectId) {
      throw new BadRequestException('Project stage does not belong to the provided project');
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

  private normalizeDelayDays(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException('Delay days must be a positive integer or zero');
    }

    return value;
  }

  private normalizeDelayHours(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 23) {
      throw new BadRequestException('Delay hours must be an integer between 0 and 23');
    }

    return value;
  }
}
