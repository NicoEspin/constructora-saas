import { AttachmentKind, DocumentPdfType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import sharp from 'sharp';
import { AttachmentsService } from './attachments.service';
import { AttachmentEntityType } from './attachments.constants';

type UploadedImageFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

describe('AttachmentsService', () => {
  function createService(overrides?: { roles?: string[]; hasPermission?: boolean }) {
    const prisma = {
      expense: { findFirst: jest.fn().mockResolvedValue({ id: 'expense-1' }) },
      project: { findFirst: jest.fn().mockResolvedValue({ id: 'project-1' }) },
      projectIncome: { findFirst: jest.fn().mockResolvedValue({ id: 'income-1' }) },
      projectStage: { findFirst: jest.fn() },
      client: { findFirst: jest.fn() },
      budget: { findFirst: jest.fn() },
      attachment: { findFirst: jest.fn(), create: jest.fn() },
      documentPdfSetting: { updateMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(),
    } as any;

    const auditService = { log: jest.fn() } as any;
    const storageService = {
      createSignedUploadUrl: jest.fn().mockResolvedValue({
        url: 'https://example.com/upload',
        expiresAt: '2026-06-19T00:00:00.000Z',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
      }),
      uploadObject: jest.fn().mockResolvedValue(undefined),
    } as any;
    const tenantContext = {
      getRoles: jest.fn().mockReturnValue(overrides?.roles ?? ['OWNER']),
    } as any;
    const rbacService = {
      hasPermission: jest.fn().mockReturnValue(overrides?.hasPermission ?? true),
    } as any;

    return {
      service: new AttachmentsService(
        prisma,
        auditService,
        storageService,
        tenantContext,
        rbacService,
      ),
      storageService,
      auditService,
      rbacService,
      prisma,
    };
  }

  it('requests a presigned URL for an expense attachment within tenant policy', async () => {
    const { service, storageService } = createService();

    const result = await service.requestUploadUrl('tenant-1', {
      entityType: AttachmentEntityType.EXPENSE,
      entityId: 'expense-1',
      kind: AttachmentKind.RECEIPT,
      fileName: 'factura.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
    });

    expect(result.uploadUrl).toBe('https://example.com/upload');
    expect(result.storageKey).toContain('tenants/tenant-1/expense/expense-1/');
    expect(storageService.createSignedUploadUrl).toHaveBeenCalled();
  });

  it('requests a presigned URL for a project income payment proof', async () => {
    const { service, storageService } = createService();

    const result = await service.requestUploadUrl('tenant-1', {
      entityType: AttachmentEntityType.PROJECT_INCOME,
      entityId: 'income-1',
      kind: AttachmentKind.PAYMENT_PROOF,
      fileName: 'transferencia.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
    });

    expect(result.uploadUrl).toBe('https://example.com/upload');
    expect(result.storageKey).toContain('tenants/tenant-1/project_income/income-1/');
    expect(storageService.createSignedUploadUrl).toHaveBeenCalled();
  });

  it('rejects document PDF uploads without settings permission', async () => {
    const { service } = createService({ roles: ['ADMIN'], hasPermission: false });

    await expect(
      service.requestUploadUrl('tenant-1', {
        entityType: AttachmentEntityType.DOCUMENT_PDF_SETTING,
        documentType: DocumentPdfType.BUDGET,
        kind: AttachmentKind.OTHER,
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileSizeBytes: 1024,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('uploads a project image as optimized webp and persists attachment metadata', async () => {
    const { service, storageService, prisma, auditService } = createService();
    const createdAttachment = {
      id: 'attachment-1',
      tenantId: 'tenant-1',
      uploadedByUserId: 'user-1',
      kind: AttachmentKind.PROGRESS_PHOTO,
      fileName: 'frente.webp',
      storageKey: 'tenants/tenant-1/project/project-1/123-frente.webp',
      mimeType: 'image/webp',
      fileSizeBytes: 123,
      notes: 'Fachada norte',
      expenseId: null,
      projectId: 'project-1',
      projectIncomeId: null,
      projectStageId: null,
      clientId: null,
      budgetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.attachment.create.mockResolvedValue(createdAttachment);

    const pngBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const file = {
      fieldname: 'file',
      originalname: 'frente.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: pngBuffer.length,
      buffer: pngBuffer,
    } as UploadedImageFile;

    const result = await service.uploadImageAttachment(
      'tenant-1',
      {
        entityType: AttachmentEntityType.PROJECT,
        entityId: 'project-1',
        kind: AttachmentKind.PROGRESS_PHOTO,
        notes: 'Fachada norte',
      },
      file,
      'user-1',
    );

    expect(result).toBe(createdAttachment);
    expect(storageService.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.stringContaining('tenants/tenant-1/project/project-1/'),
        contentType: 'image/webp',
        body: expect.any(Buffer),
      }),
    );
    expect(prisma.attachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          uploadedByUserId: 'user-1',
          projectId: 'project-1',
          kind: AttachmentKind.PROGRESS_PHOTO,
          fileName: 'frente.webp',
          mimeType: 'image/webp',
          notes: 'Fachada norte',
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'attachment.create',
        tenantId: 'tenant-1',
        userId: 'user-1',
        metadata: expect.objectContaining({ transformedToWebp: true }),
      }),
    );
  });
});
