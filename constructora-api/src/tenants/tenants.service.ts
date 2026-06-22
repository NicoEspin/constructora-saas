import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentsService } from '../attachments/attachments.service';
import { PrismaService } from '../common/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

const Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async create(dto: CreateTenantDto, ownerId: string) {
    const slug = this.generateSlug(dto.name);
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Tenant slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        memberships: {
          create: { userId: ownerId, role: Role.OWNER },
        },
      },
      include: { memberships: true },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, actorUserId: string) {
    const previousTenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { logoAttachmentId: true },
    });
    const hasLogoAttachmentId = Object.prototype.hasOwnProperty.call(dto, 'logoAttachmentId');
    const nextLogoAttachmentId = hasLogoAttachmentId
      ? (dto.logoAttachmentId ?? null)
      : (previousTenant?.logoAttachmentId ?? null);

    if (hasLogoAttachmentId) {
      await this.ensureLogoBelongsToTenant(id, nextLogoAttachmentId);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    const previousLogoAttachmentId = previousTenant?.logoAttachmentId ?? null;

    if (
      hasLogoAttachmentId &&
      previousLogoAttachmentId &&
      previousLogoAttachmentId !== nextLogoAttachmentId
    ) {
      await this.attachmentsService.deleteAttachment(id, previousLogoAttachmentId, actorUserId);
    }

    return tenant;
  }

  async getMembers(tenantId: string) {
    return this.prisma.membership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureLogoBelongsToTenant(tenantId: string, logoAttachmentId: string | null) {
    if (!logoAttachmentId) {
      return;
    }

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: logoAttachmentId, tenantId },
      select: { id: true },
    });

    if (!attachment) {
      throw new NotFoundException('Logo attachment not found for this tenant');
    }
  }
}
