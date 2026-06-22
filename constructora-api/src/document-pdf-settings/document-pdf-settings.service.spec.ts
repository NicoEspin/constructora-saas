import { DocumentPdfLayout, DocumentPdfType } from '@prisma/client';
import { DocumentPdfSettingsService } from './document-pdf-settings.service';

describe('DocumentPdfSettingsService', () => {
  function createService() {
    const prisma = {
      documentPdfSetting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      attachment: {
        findFirst: jest.fn(),
      },
    } as any;

    const auditService = { log: jest.fn() } as any;
    const attachmentsService = { deleteAttachment: jest.fn() } as any;

    return {
      service: new DocumentPdfSettingsService(prisma, auditService, attachmentsService),
      prisma,
    };
  }

  it('falls back to the tenant logo when the budget setting has no own logo', async () => {
    const { service, prisma } = createService();

    prisma.documentPdfSetting.findUnique.mockResolvedValue({
      id: 'setting-1',
      tenantId: 'tenant-1',
      documentType: DocumentPdfType.BUDGET,
      layout: DocumentPdfLayout.CLASSIC,
      primaryColor: '#1D4ED8',
      logoAttachmentId: null,
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      updatedAt: new Date('2026-06-20T10:00:00.000Z'),
    });
    prisma.tenant.findUnique.mockResolvedValue({ logoAttachmentId: 'tenant-logo-1' });

    const result = await service.findOne('tenant-1', DocumentPdfType.BUDGET);

    expect(result.logoAttachmentId).toBeNull();
    expect(result.tenantLogoAttachmentId).toBe('tenant-logo-1');
    expect(result.effectiveLogoAttachmentId).toBe('tenant-logo-1');
    expect(result.effectiveLogoSource).toBe('TENANT');
  });

  it('prioritizes the budget logo over the tenant fallback', async () => {
    const { service, prisma } = createService();

    prisma.documentPdfSetting.findUnique.mockResolvedValue({
      id: 'setting-1',
      tenantId: 'tenant-1',
      documentType: DocumentPdfType.BUDGET,
      layout: DocumentPdfLayout.ACCENT,
      primaryColor: '#0F172A',
      logoAttachmentId: 'budget-logo-1',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      updatedAt: new Date('2026-06-20T10:00:00.000Z'),
    });
    prisma.tenant.findUnique.mockResolvedValue({ logoAttachmentId: 'tenant-logo-1' });

    const result = await service.findOne('tenant-1', DocumentPdfType.BUDGET);

    expect(result.logoAttachmentId).toBe('budget-logo-1');
    expect(result.tenantLogoAttachmentId).toBe('tenant-logo-1');
    expect(result.effectiveLogoAttachmentId).toBe('budget-logo-1');
    expect(result.effectiveLogoSource).toBe('DOCUMENT');
  });
});
