import {
  Attachment,
  AttachmentKind,
  DocumentPdfType,
  Prisma,
  type Membership,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { RbacService } from '../rbac/rbac.service';
import { StorageService } from '../storage/storage.service';
import {
  ATTACHMENT_ENTITY_POLICIES,
  AttachmentEntityType,
  DOCUMENT_PDF_ATTACHMENT_TYPES,
} from './attachments.constants';
import {
  FinalizeAttachmentUploadDto,
  RequestAttachmentUploadDto,
  UploadImageAttachmentDto,
} from './dto/request-attachment-upload.dto';
import { ListAttachmentsQueryDto } from './dto/list-attachments-query.dto';

type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const attachmentSelect = {
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

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly tenantContext: TenantContextService,
    private readonly rbacService: RbacService,
  ) {}

  async requestUploadUrl(tenantId: string, dto: RequestAttachmentUploadDto) {
    this.assertTenantId(tenantId);
    await this.assertEntityAccess(dto, 'write');
    await this.validateUploadPolicy(
      dto.entityType,
      dto.kind,
      dto.mimeType,
      dto.fileSizeBytes,
      dto.documentType,
    );
    await this.ensureEntityBelongsToTenant(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.documentType,
    );

    const storageKey = this.buildStorageKey(tenantId, dto);
    const signedUpload = await this.storageService.createSignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
    });

    return {
      uploadUrl: signedUpload.url,
      storageKey,
      requiredHeaders: signedUpload.requiredHeaders,
      expiresAt: signedUpload.expiresAt,
    };
  }

  async finalizeUpload(tenantId: string, dto: FinalizeAttachmentUploadDto, actorUserId: string) {
    this.assertTenantId(tenantId);
    await this.assertEntityAccess(dto, 'write');
    await this.validateUploadPolicy(
      dto.entityType,
      dto.kind,
      dto.mimeType,
      dto.fileSizeBytes,
      dto.documentType,
    );
    await this.ensureEntityBelongsToTenant(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.documentType,
    );

    const expectedPrefix = this.buildStorageKeyPrefix(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.documentType,
    );
    if (!dto.storageKey.startsWith(expectedPrefix)) {
      throw new BadRequestException('Storage key does not belong to this tenant or entity');
    }

    const existing = await this.prisma.attachment.findFirst({
      where: { tenantId, storageKey: dto.storageKey },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Attachment already finalized for this object');
    }

    const objectMetadata = await this.storageService.getObjectMetadata(dto.storageKey);
    if (!objectMetadata.contentLength || objectMetadata.contentLength > dto.fileSizeBytes) {
      throw new BadRequestException('Uploaded object size does not match the declared file size');
    }

    if (dto.mimeType && objectMetadata.contentType && objectMetadata.contentType !== dto.mimeType) {
      throw new BadRequestException(
        'Uploaded object content type does not match the declared mime type',
      );
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        tenantId,
        uploadedByUserId: actorUserId,
        kind: dto.kind,
        fileName: this.normalizeFileName(dto.fileName),
        storageKey: dto.storageKey,
        mimeType: objectMetadata.contentType ?? dto.mimeType,
        fileSizeBytes: objectMetadata.contentLength,
        notes: this.normalizeOptionalString(dto.notes),
        ...this.buildEntityReferenceData(dto.entityType, dto.entityId),
      },
      select: attachmentSelect,
    });

    await this.auditService.log({
      action: 'attachment.create',
      entity: 'attachment',
      entityId: attachment.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        kind: attachment.kind,
        fileName: attachment.fileName,
        entityType: dto.entityType,
        entityId: dto.entityId ?? dto.documentType ?? null,
      },
    });

    return attachment;
  }

  async uploadImageAttachment(
    tenantId: string,
    dto: UploadImageAttachmentDto,
    file: UploadedImageFile,
    actorUserId: string,
  ) {
    this.assertTenantId(tenantId);

    if (!file.mimetype || !this.isImageMimeType(file.mimetype) || !file.buffer?.length) {
      throw new BadRequestException('A valid image file is required');
    }

    await this.assertEntityAccess(dto, 'write');
    await this.validateUploadPolicy(
      dto.entityType,
      dto.kind,
      file.mimetype,
      file.size,
      dto.documentType,
    );
    await this.ensureEntityBelongsToTenant(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.documentType,
    );

    const optimizedImage = await this.optimizeImageToWebp(file);
    await this.validateUploadPolicy(
      dto.entityType,
      dto.kind,
      optimizedImage.mimeType,
      optimizedImage.fileSizeBytes,
      dto.documentType,
    );

    const fileName = this.buildStoredImageFileName(file.originalname);
    const storageKey = this.buildStorageKey(tenantId, {
      ...dto,
      fileName,
      mimeType: optimizedImage.mimeType,
      fileSizeBytes: optimizedImage.fileSizeBytes,
    });

    await this.storageService.uploadObject({
      key: storageKey,
      body: optimizedImage.buffer,
      contentType: optimizedImage.mimeType,
    });

    const attachment = await this.prisma.attachment.create({
      data: {
        tenantId,
        uploadedByUserId: actorUserId,
        kind: dto.kind,
        fileName,
        storageKey,
        mimeType: optimizedImage.mimeType,
        fileSizeBytes: optimizedImage.fileSizeBytes,
        notes: this.normalizeOptionalString(dto.notes),
        ...this.buildEntityReferenceData(dto.entityType, dto.entityId),
      },
      select: attachmentSelect,
    });

    await this.auditService.log({
      action: 'attachment.create',
      entity: 'attachment',
      entityId: attachment.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        kind: attachment.kind,
        fileName: attachment.fileName,
        entityType: dto.entityType,
        entityId: dto.entityId ?? dto.documentType ?? null,
        transformedToWebp: true,
      },
    });

    return attachment;
  }

  async listByEntity(tenantId: string, query: ListAttachmentsQueryDto) {
    this.assertTenantId(tenantId);
    await this.assertEntityAccess(query, 'read');
    await this.ensureEntityBelongsToTenant(
      tenantId,
      query.entityType,
      query.entityId,
      query.documentType,
    );

    return this.prisma.attachment.findMany({
      where: this.buildEntityWhere(tenantId, query.entityType, query.entityId, query.documentType),
      select: attachmentSelect,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getSignedAccessUrl(tenantId: string, attachmentId: string, download: boolean) {
    this.assertTenantId(tenantId);
    const attachment = await this.findAttachmentOrThrow(tenantId, attachmentId);
    await this.assertAttachmentAccess(attachment, download ? 'read' : 'read');

    return this.storageService.createSignedAccessUrl({
      key: attachment.storageKey,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      download,
    });
  }

  async deleteAttachment(tenantId: string, attachmentId: string, actorUserId: string) {
    this.assertTenantId(tenantId);
    const attachment = await this.findAttachmentOrThrow(tenantId, attachmentId);
    await this.assertAttachmentAccess(attachment, 'write');

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.updateMany({
        where: { id: tenantId, logoAttachmentId: attachment.id },
        data: { logoAttachmentId: null },
      });
      await tx.documentPdfSetting.updateMany({
        where: { tenantId, logoAttachmentId: attachment.id },
        data: { logoAttachmentId: null },
      });
      await tx.attachment.delete({ where: { id: attachment.id } });
    });

    await this.storageService.deleteObject(attachment.storageKey);
    await this.auditService.log({
      action: 'attachment.delete',
      entity: 'attachment',
      entityId: attachment.id,
      tenantId,
      userId: actorUserId,
      metadata: {
        kind: attachment.kind,
        fileName: attachment.fileName,
      },
    });

    return { success: true };
  }

  async deleteExpenseAttachments(tenantId: string, expenseId: string, actorUserId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { tenantId, expenseId },
      select: { id: true },
    });

    for (const attachment of attachments) {
      await this.deleteAttachment(tenantId, attachment.id, actorUserId);
    }
  }

  async deleteProjectIncomeAttachments(
    tenantId: string,
    projectIncomeId: string,
    actorUserId: string,
  ) {
    const attachments = await this.prisma.attachment.findMany({
      where: { tenantId, projectIncomeId },
      select: { id: true },
    });

    for (const attachment of attachments) {
      await this.deleteAttachment(tenantId, attachment.id, actorUserId);
    }
  }

  private async validateUploadPolicy(
    entityType: AttachmentEntityType,
    kind: AttachmentKind,
    mimeType: string,
    fileSizeBytes: number,
    documentType?: DocumentPdfType,
  ) {
    const policy = ATTACHMENT_ENTITY_POLICIES[entityType];
    if (!policy) {
      throw new BadRequestException('Unsupported attachment entity type');
    }

    if (!policy.allowedKinds.includes(kind)) {
      throw new BadRequestException(`Attachment kind ${kind} is not allowed for ${entityType}`);
    }

    if (fileSizeBytes > policy.maxSizeBytes) {
      throw new BadRequestException(`File exceeds the allowed size limit for ${entityType}`);
    }

    if (!policy.allowedMimeTypes.some((pattern) => pattern.test(mimeType))) {
      throw new BadRequestException(`Mime type ${mimeType} is not allowed for ${entityType}`);
    }

    if (
      entityType === AttachmentEntityType.DOCUMENT_PDF_SETTING &&
      (!documentType || !DOCUMENT_PDF_ATTACHMENT_TYPES.has(documentType))
    ) {
      throw new BadRequestException('Unsupported document PDF setting attachment target');
    }

    if (kind === AttachmentKind.PROGRESS_PHOTO && fileSizeBytes > 15 * 1024 * 1024) {
      throw new BadRequestException('Project photos cannot exceed 15MB');
    }

    const isTechnicalDocumentKind =
      kind === AttachmentKind.PLAN ||
      kind === AttachmentKind.CONTRACT ||
      kind === AttachmentKind.CLIENT_DOCUMENT ||
      kind === AttachmentKind.SIGNED_BUDGET;

    if (isTechnicalDocumentKind && fileSizeBytes > 20 * 1024 * 1024) {
      throw new BadRequestException('Technical and contractual documents cannot exceed 20MB');
    }
  }

  private async ensureEntityBelongsToTenant(
    tenantId: string,
    entityType: AttachmentEntityType,
    entityId?: string,
    documentType?: DocumentPdfType,
  ) {
    switch (entityType) {
      case AttachmentEntityType.TENANT:
        if (entityId !== tenantId) {
          throw new NotFoundException('Tenant not found');
        }
        return;
      case AttachmentEntityType.EXPENSE:
        await this.ensureRecordExists(this.prisma.expense, tenantId, entityId, 'Expense not found');
        return;
      case AttachmentEntityType.PROJECT:
        await this.ensureRecordExists(this.prisma.project, tenantId, entityId, 'Project not found');
        return;
      case AttachmentEntityType.PROJECT_INCOME:
        await this.ensureRecordExists(
          this.prisma.projectIncome,
          tenantId,
          entityId,
          'Project income not found',
        );
        return;
      case AttachmentEntityType.PROJECT_STAGE:
        await this.ensureRecordExists(
          this.prisma.projectStage,
          tenantId,
          entityId,
          'Project stage not found',
        );
        return;
      case AttachmentEntityType.CLIENT:
        await this.ensureRecordExists(this.prisma.client, tenantId, entityId, 'Client not found');
        return;
      case AttachmentEntityType.BUDGET:
        await this.ensureRecordExists(this.prisma.budget, tenantId, entityId, 'Budget not found');
        return;
      case AttachmentEntityType.DOCUMENT_PDF_SETTING:
        if (!documentType) {
          throw new BadRequestException(
            'documentType is required for document PDF setting attachments',
          );
        }
        return;
      default:
        throw new BadRequestException('Unsupported attachment entity type');
    }
  }

  private async ensureRecordExists(
    model: {
      findFirst(args: {
        where: { id?: string; tenantId: string };
        select: { id: true };
      }): Promise<{ id: string } | null>;
    },
    tenantId: string,
    entityId: string | undefined,
    notFoundMessage: string,
  ) {
    if (!entityId) {
      throw new BadRequestException('entityId is required for this attachment entity type');
    }

    const record = await model.findFirst({
      where: { id: entityId, tenantId },
      select: { id: true },
    });
    if (!record) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private buildStorageKey(tenantId: string, dto: RequestAttachmentUploadDto) {
    const prefix = this.buildStorageKeyPrefix(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.documentType,
    );
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}${timestamp}-${random}-${this.normalizeFileName(dto.fileName)}`;
  }

  private buildStorageKeyPrefix(
    tenantId: string,
    entityType: AttachmentEntityType,
    entityId?: string,
    documentType?: DocumentPdfType,
  ) {
    const entityRef =
      entityType === AttachmentEntityType.DOCUMENT_PDF_SETTING
        ? documentType?.toLowerCase()
        : entityId;

    if (!entityRef) {
      throw new BadRequestException('Missing entity reference for storage key generation');
    }

    return `tenants/${tenantId}/${entityType.toLowerCase()}/${entityRef}/`;
  }

  private buildEntityReferenceData(entityType: AttachmentEntityType, entityId?: string) {
    switch (entityType) {
      case AttachmentEntityType.TENANT:
        return {};
      case AttachmentEntityType.EXPENSE:
        return { expenseId: entityId! };
      case AttachmentEntityType.PROJECT:
        return { projectId: entityId! };
      case AttachmentEntityType.PROJECT_INCOME:
        return { projectIncomeId: entityId! };
      case AttachmentEntityType.PROJECT_STAGE:
        return { projectStageId: entityId! };
      case AttachmentEntityType.CLIENT:
        return { clientId: entityId! };
      case AttachmentEntityType.BUDGET:
        return { budgetId: entityId! };
      case AttachmentEntityType.DOCUMENT_PDF_SETTING:
        return {};
      default:
        return {};
    }
  }

  private buildEntityWhere(
    tenantId: string,
    entityType: AttachmentEntityType,
    entityId?: string,
    documentType?: DocumentPdfType,
  ): Prisma.AttachmentWhereInput {
    switch (entityType) {
      case AttachmentEntityType.TENANT:
        return {
          tenantId,
          tenantLogos: {
            some: {
              id: entityId,
            },
          },
        };
      case AttachmentEntityType.EXPENSE:
        return { tenantId, expenseId: entityId };
      case AttachmentEntityType.PROJECT:
        return { tenantId, projectId: entityId };
      case AttachmentEntityType.PROJECT_INCOME:
        return { tenantId, projectIncomeId: entityId };
      case AttachmentEntityType.PROJECT_STAGE:
        return { tenantId, projectStageId: entityId };
      case AttachmentEntityType.CLIENT:
        return { tenantId, clientId: entityId };
      case AttachmentEntityType.BUDGET:
        return { tenantId, budgetId: entityId };
      case AttachmentEntityType.DOCUMENT_PDF_SETTING:
        return {
          tenantId,
          documentPdfLogos: {
            some: {
              tenantId,
              documentType,
            },
          },
        };
      default:
        return { tenantId, id: '__never__' };
    }
  }

  private async findAttachmentOrThrow(tenantId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
      include: {
        documentPdfLogos: {
          select: {
            id: true,
            documentType: true,
          },
        },
        tenantLogos: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  private async assertEntityAccess(
    target: { entityType: AttachmentEntityType },
    access: 'read' | 'write',
  ) {
    if (
      target.entityType !== AttachmentEntityType.DOCUMENT_PDF_SETTING &&
      target.entityType !== AttachmentEntityType.TENANT
    ) {
      return;
    }

    const roles = this.tenantContext.getRoles() as Membership['role'][];
    const requiredPermission = access === 'write' ? 'settings.write' : 'settings.read';

    if (!this.rbacService.hasPermission(roles, requiredPermission)) {
      throw new ForbiddenException('Insufficient permissions for document PDF attachments');
    }
  }

  private async assertAttachmentAccess(
    attachment: Attachment & {
      documentPdfLogos?: Array<{ id: string; documentType: DocumentPdfType }>;
      tenantLogos?: Array<{ id: string }>;
    },
    access: 'read' | 'write',
  ) {
    if (!attachment.documentPdfLogos?.length && !attachment.tenantLogos?.length) {
      return;
    }

    await this.assertEntityAccess(
      {
        entityType: attachment.tenantLogos?.length
          ? AttachmentEntityType.TENANT
          : AttachmentEntityType.DOCUMENT_PDF_SETTING,
      },
      access,
    );
  }

  private normalizeFileName(fileName: string) {
    const trimmed = fileName.trim().replace(/\s+/g, '-');
    return trimmed.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 255) || 'file';
  }

  private buildStoredImageFileName(originalFileName: string) {
    const basename = originalFileName.replace(/\.[^.]+$/, '').trim() || 'image';
    return this.normalizeFileName(`${basename}.webp`);
  }

  private isImageMimeType(mimeType: string) {
    return /^image\//i.test(mimeType);
  }

  private async optimizeImageToWebp(file: UploadedImageFile) {
    try {
      const result = await sharp(file.buffer)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: result.data,
        fileSizeBytes: result.info.size,
        mimeType: 'image/webp',
      };
    } catch {
      throw new BadRequestException('Image could not be processed');
    }
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private assertTenantId(tenantId: string | undefined) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
  }
}
