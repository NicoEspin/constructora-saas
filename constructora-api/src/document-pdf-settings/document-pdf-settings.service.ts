import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DocumentPdfLayout,
  DocumentPdfLogoSize,
  DocumentPdfType,
  Prisma,
  type DocumentPdfSetting,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { PrismaService } from '../common/prisma.service';
import { UpdateDocumentPdfSettingDto } from './dto/update-document-pdf-setting.dto';

const DEFAULT_DOCUMENT_PDF_SETTINGS: Record<
  DocumentPdfType,
  Pick<DocumentPdfSetting, 'layout' | 'primaryColor' | 'logoAttachmentId' | 'logoSize'>
> = {
  [DocumentPdfType.BUDGET]: {
    layout: DocumentPdfLayout.CLASSIC,
    primaryColor: '#1D4ED8',
    logoAttachmentId: null,
    logoSize: DocumentPdfLogoSize.MEDIUM,
  },
  [DocumentPdfType.PROJECT_OPERATIONAL_REPORT]: {
    layout: DocumentPdfLayout.COMPACT,
    primaryColor: '#0F766E',
    logoAttachmentId: null,
    logoSize: DocumentPdfLogoSize.MEDIUM,
  },
  [DocumentPdfType.PROJECT_EXECUTIVE_REPORT]: {
    layout: DocumentPdfLayout.ACCENT,
    primaryColor: '#7C3AED',
    logoAttachmentId: null,
    logoSize: DocumentPdfLogoSize.MEDIUM,
  },
};

@Injectable()
export class DocumentPdfSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async findOne(tenantId: string, documentType: DocumentPdfType) {
    this.assertTenantId(tenantId);

    try {
      const [setting, tenant] = await Promise.all([
        this.prisma.documentPdfSetting.findUnique({
          where: {
            tenantId_documentType: {
              tenantId,
              documentType,
            },
          },
        }),
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { logoAttachmentId: true },
        }),
      ]);

      return this.toResponse(tenantId, documentType, setting, tenant?.logoAttachmentId ?? null);
    } catch (error) {
      if (this.isMissingStorageError(error)) {
        return this.toResponse(tenantId, documentType, null, null);
      }

      throw error;
    }
  }

  async upsert(
    tenantId: string,
    documentType: DocumentPdfType,
    dto: UpdateDocumentPdfSettingDto,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logoAttachmentId: true },
    });

    const previousSetting = await this.prisma.documentPdfSetting.findUnique({
      where: {
        tenantId_documentType: {
          tenantId,
          documentType,
        },
      },
      select: { logoAttachmentId: true },
    });
    const logoAttachmentId = dto.logoAttachmentId ?? null;
    await this.ensureLogoBelongsToTenant(tenantId, logoAttachmentId);

    const setting = await this.prisma.documentPdfSetting.upsert({
      where: {
        tenantId_documentType: {
          tenantId,
          documentType,
        },
      },
      create: {
        tenantId,
        documentType,
        layout: dto.layout,
        primaryColor: dto.primaryColor.toUpperCase(),
        logoAttachmentId,
        logoSize: dto.logoSize,
      },
      update: {
        layout: dto.layout,
        primaryColor: dto.primaryColor.toUpperCase(),
        logoAttachmentId,
        logoSize: dto.logoSize,
      },
    });

    await this.auditService.log({
      action: 'document-pdf-setting.update',
      entity: 'document-pdf-setting',
      entityId: setting.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        documentType,
        layout: setting.layout,
        primaryColor: setting.primaryColor,
        logoAttachmentId: setting.logoAttachmentId,
        logoSize: setting.logoSize,
      },
    });

    const previousLogoAttachmentId = previousSetting?.logoAttachmentId ?? null;
    if (previousLogoAttachmentId && previousLogoAttachmentId !== logoAttachmentId) {
      await this.attachmentsService.deleteAttachment(
        tenantId,
        previousLogoAttachmentId,
        actorUserId,
      );
    }

    return this.toResponse(tenantId, documentType, setting, tenant?.logoAttachmentId ?? null);
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

  private toResponse(
    tenantId: string,
    documentType: DocumentPdfType,
    setting: DocumentPdfSetting | null,
    tenantLogoAttachmentId: string | null,
  ) {
    const effectiveLogoAttachmentId = setting?.logoAttachmentId ?? tenantLogoAttachmentId ?? null;
    const effectiveLogoSource = setting?.logoAttachmentId
      ? 'DOCUMENT'
      : tenantLogoAttachmentId
        ? 'TENANT'
        : 'NONE';

    if (setting) {
      return {
        id: setting.id,
        tenantId,
        documentType,
        layout: setting.layout,
        primaryColor: setting.primaryColor,
        logoAttachmentId: setting.logoAttachmentId,
        logoSize: setting.logoSize,
        tenantLogoAttachmentId,
        effectiveLogoAttachmentId,
        effectiveLogoSource,
        isDefault: false,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      };
    }

    const fallback = DEFAULT_DOCUMENT_PDF_SETTINGS[documentType];

    return {
      id: null,
      tenantId,
      documentType,
      layout: fallback.layout,
      primaryColor: fallback.primaryColor,
      logoAttachmentId: fallback.logoAttachmentId,
      logoSize: fallback.logoSize,
      tenantLogoAttachmentId,
      effectiveLogoAttachmentId,
      effectiveLogoSource,
      isDefault: true,
      createdAt: null,
      updatedAt: null,
    };
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }

  private isMissingStorageError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
  }
}
