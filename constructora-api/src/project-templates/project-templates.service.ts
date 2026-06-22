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
import { CreateProjectTemplateStageDto } from './dto/create-project-template-stage.dto';
import { CreateProjectTemplateDto } from './dto/create-project-template.dto';
import { ListProjectTemplatesQueryDto } from './dto/list-project-templates-query.dto';
import { UpdateProjectTemplateStageDto } from './dto/update-project-template-stage.dto';
import { UpdateProjectTemplateDto } from './dto/update-project-template.dto';

type PrismaTransaction = Prisma.TransactionClient;

const projectTemplateStageInclude = {
  tasks: {
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.ProjectTemplateStageInclude;

@Injectable()
export class ProjectTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateProjectTemplateDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const normalizedName = this.requireTrimmedString(dto.name, 'Project template name is required');
    await this.ensureTemplateNameAvailable(tenantId, normalizedName);

    try {
      const template = await this.prisma.projectTemplate.create({
        data: {
          tenantId,
          name: normalizedName,
          description: this.normalizeOptionalString(dto.description),
        },
      });

      await this.auditService.log({
        action: 'project-template.create',
        entity: 'project-template',
        entityId: template.id,
        tenantId,
        userId: actorUserId,
        metadata: { name: template.name },
      });

      return template;
    } catch (error) {
      this.rethrowUniqueConstraint(error);
      throw error;
    }
  }

  async findAll(tenantId: string, query: ListProjectTemplatesQueryDto) {
    this.assertTenantId(tenantId);

    const page = query.page ?? 1;
    const take = query.take ?? 20;
    const skip = (page - 1) * take;
    const search = query.search?.trim();

    const where: Prisma.ProjectTemplateWhereInput = {
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

    const [items, total] = await Promise.all([
      this.prisma.projectTemplate.findMany({
        where,
        orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
        skip,
        take,
      }),
      this.prisma.projectTemplate.count({ where }),
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
    return this.findTemplateOrThrow(tenantId, id);
  }

  async update(tenantId: string, id: string, dto: UpdateProjectTemplateDto, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findTemplateOrThrow(tenantId, id);

    if (dto.name !== undefined) {
      const normalizedName = this.requireTrimmedString(
        dto.name,
        'Project template name is required',
      );
      await this.ensureTemplateNameAvailable(tenantId, normalizedName, id);
    }

    try {
      const template = await this.prisma.projectTemplate.update({
        where: { id },
        data: {
          ...(dto.name !== undefined
            ? {
                name: this.requireTrimmedString(dto.name, 'Project template name is required'),
              }
            : {}),
          ...(dto.description !== undefined
            ? { description: this.normalizeOptionalString(dto.description) }
            : {}),
        },
      });

      await this.auditService.log({
        action: 'project-template.update',
        entity: 'project-template',
        entityId: template.id,
        tenantId,
        userId: actorUserId,
        metadata: { fromName: existing.name, toName: template.name },
      });

      return template;
    } catch (error) {
      this.rethrowUniqueConstraint(error);
      throw error;
    }
  }

  async remove(tenantId: string, id: string, actorUserId: string) {
    this.assertTenantId(tenantId);

    const existing = await this.findTemplateOrThrow(tenantId, id);
    await this.assertTemplateIsDeletable(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.projectTemplateStage.deleteMany({
        where: { tenantId, projectTemplateId: id },
      });
      await tx.projectTemplate.delete({ where: { id } });
    });

    await this.auditService.log({
      action: 'project-template.delete',
      entity: 'project-template',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: { name: existing.name },
    });

    return { success: true };
  }

  async findStages(tenantId: string, templateId: string) {
    this.assertTenantId(tenantId);
    await this.findTemplateOrThrow(tenantId, templateId);

    return this.prisma.projectTemplateStage.findMany({
      where: { tenantId, projectTemplateId: templateId },
      include: projectTemplateStageInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createStage(
    tenantId: string,
    templateId: string,
    dto: CreateProjectTemplateStageDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);
    await this.findTemplateOrThrow(tenantId, templateId);

    try {
      const stage = await this.prisma.$transaction(async (tx) => {
        const position =
          dto.position ?? (await this.findNextStagePosition(tx, tenantId, templateId));

        await this.ensureStagePositionAvailable(tx, tenantId, templateId, position);

        const createdStage = await tx.projectTemplateStage.create({
          data: {
            tenantId,
            projectTemplateId: templateId,
            name: this.requireTrimmedString(dto.name, 'Project template stage name is required'),
            description: this.normalizeOptionalString(dto.description),
            position,
            weightPercent: dto.weightPercent ?? null,
          },
        });
        await this.replaceTemplateStageTasks(tx, tenantId, createdStage.id, dto.tasks);

        return tx.projectTemplateStage.findFirstOrThrow({
          where: { id: createdStage.id, tenantId, projectTemplateId: templateId },
          include: projectTemplateStageInclude,
        });
      });

      await this.auditService.log({
        action: 'project-template-stage.create',
        entity: 'project-template-stage',
        entityId: stage.id,
        tenantId,
        userId: actorUserId,
        metadata: {
          projectTemplateId: templateId,
          name: stage.name,
          position: stage.position,
          weightPercent: stage.weightPercent,
          tasksCount: stage.tasks.length,
        },
      });

      return stage;
    } catch (error) {
      this.rethrowUniqueConstraint(
        error,
        'Stage position is already in use for this project template',
      );
      throw error;
    }
  }

  async findStage(tenantId: string, templateId: string, stageId: string) {
    this.assertTenantId(tenantId);
    await this.findTemplateOrThrow(tenantId, templateId);
    return this.findStageOrThrow(tenantId, templateId, stageId);
  }

  async updateStage(
    tenantId: string,
    templateId: string,
    stageId: string,
    dto: UpdateProjectTemplateStageDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);
    await this.findTemplateOrThrow(tenantId, templateId);

    const existing = await this.findStageOrThrow(tenantId, templateId, stageId);
    const resolvedPosition = dto.position ?? existing.position;

    try {
      const stage = await this.prisma.$transaction(async (tx) => {
        await this.ensureStagePositionAvailable(
          tx,
          tenantId,
          templateId,
          resolvedPosition,
          stageId,
        );

        await tx.projectTemplateStage.update({
          where: { id: stageId },
          data: {
            ...(dto.name !== undefined
              ? {
                  name: this.requireTrimmedString(
                    dto.name,
                    'Project template stage name is required',
                  ),
                }
              : {}),
            ...(dto.description !== undefined
              ? { description: this.normalizeOptionalString(dto.description) }
              : {}),
            ...(dto.position !== undefined ? { position: dto.position } : {}),
            ...(dto.weightPercent !== undefined
              ? { weightPercent: dto.weightPercent ?? null }
              : {}),
          },
        });
        await this.replaceTemplateStageTasks(tx, tenantId, stageId, dto.tasks);

        return tx.projectTemplateStage.findFirstOrThrow({
          where: { id: stageId, tenantId, projectTemplateId: templateId },
          include: projectTemplateStageInclude,
        });
      });

      await this.auditService.log({
        action: 'project-template-stage.update',
        entity: 'project-template-stage',
        entityId: stage.id,
        tenantId,
        userId: actorUserId,
        metadata: {
          projectTemplateId: templateId,
          name: stage.name,
          position: stage.position,
          weightPercent: stage.weightPercent,
          tasksCount: stage.tasks.length,
        },
      });

      return stage;
    } catch (error) {
      this.rethrowUniqueConstraint(
        error,
        'Stage position is already in use for this project template',
      );
      throw error;
    }
  }

  async removeStage(tenantId: string, templateId: string, stageId: string, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.findTemplateOrThrow(tenantId, templateId);

    const existing = await this.findStageOrThrow(tenantId, templateId, stageId);
    const materializedCount = await this.prisma.projectStage.count({
      where: { tenantId, projectTemplateStageId: stageId },
    });

    if (materializedCount > 0) {
      throw new BadRequestException(
        'Project template stage cannot be deleted while it is materialized in projects',
      );
    }

    await this.prisma.projectTemplateStage.delete({ where: { id: stageId } });

    await this.auditService.log({
      action: 'project-template-stage.delete',
      entity: 'project-template-stage',
      entityId: existing.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        projectTemplateId: templateId,
        name: existing.name,
        position: existing.position,
        weightPercent: existing.weightPercent,
      },
    });

    return { success: true };
  }

  private async findTemplateOrThrow(tenantId: string, id: string) {
    const template = await this.prisma.projectTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Project template not found');
    }

    return template;
  }

  private async findStageOrThrow(tenantId: string, templateId: string, stageId: string) {
    const stage = await this.prisma.projectTemplateStage.findFirst({
      where: {
        id: stageId,
        tenantId,
        projectTemplateId: templateId,
      },
      include: projectTemplateStageInclude,
    });

    if (!stage) {
      throw new NotFoundException('Project template stage not found');
    }

    return stage;
  }

  private async ensureTemplateNameAvailable(tenantId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.projectTemplate.findFirst({
      where: {
        tenantId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Project template already exists');
    }
  }

  private async assertTemplateIsDeletable(tenantId: string, templateId: string) {
    const [projectsCount, materializedStagesCount] = await Promise.all([
      this.prisma.project.count({
        where: { tenantId, projectTemplateId: templateId },
      }),
      this.prisma.projectStage.count({
        where: {
          tenantId,
          projectTemplateStage: {
            projectTemplateId: templateId,
          },
        },
      }),
    ]);

    if (projectsCount > 0 || materializedStagesCount > 0) {
      throw new BadRequestException(
        'Project template cannot be deleted while it is in use by projects',
      );
    }
  }

  private async findNextStagePosition(tx: PrismaTransaction, tenantId: string, templateId: string) {
    const lastStage = await tx.projectTemplateStage.findFirst({
      where: { tenantId, projectTemplateId: templateId },
      select: { position: true },
      orderBy: { position: 'desc' },
    });

    return (lastStage?.position ?? 0) + 1;
  }

  private async ensureStagePositionAvailable(
    tx: PrismaTransaction,
    tenantId: string,
    templateId: string,
    position: number,
    stageIdToExclude?: string,
  ) {
    const stage = await tx.projectTemplateStage.findFirst({
      where: {
        tenantId,
        projectTemplateId: templateId,
        position,
        ...(stageIdToExclude ? { NOT: { id: stageIdToExclude } } : {}),
      },
      select: { id: true },
    });

    if (stage) {
      throw new BadRequestException('Stage position is already in use for this project template');
    }
  }

  private async replaceTemplateStageTasks(
    tx: PrismaService | PrismaTransaction,
    tenantId: string,
    projectTemplateStageId: string,
    tasks: Array<{ title: string }> | undefined,
  ) {
    if (tasks === undefined) {
      return;
    }

    const normalizedTasks = this.normalizeTaskTitles(tasks);

    await tx.projectTemplateStageTask.deleteMany({
      where: { tenantId, projectTemplateStageId },
    });

    if (normalizedTasks.length === 0) {
      return;
    }

    await tx.projectTemplateStageTask.createMany({
      data: normalizedTasks.map((title, index) => ({
        tenantId,
        projectTemplateStageId,
        title,
        position: index + 1,
      })),
    });
  }

  private normalizeTaskTitles(tasks: Array<{ title: string }>) {
    return tasks.map(({ title }, index) => {
      const normalized = title.trim();

      if (!normalized) {
        throw new BadRequestException(`Task ${index + 1} title is required`);
      }

      if (normalized.length > 240) {
        throw new BadRequestException(`Task ${index + 1} title must be 240 characters or less`);
      }

      return normalized;
    });
  }

  private rethrowUniqueConstraint(error: unknown, message = 'Project template already exists') {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
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
