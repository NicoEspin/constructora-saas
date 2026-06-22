import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  function createService() {
    const prisma = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      attachment: {
        findFirst: jest.fn(),
      },
    } as any;

    const attachmentsService = {
      deleteAttachment: jest.fn(),
    } as any;

    return {
      service: new TenantsService(prisma, attachmentsService),
      prisma,
      attachmentsService,
    };
  }

  it('deletes the previous tenant logo when a new one replaces it', async () => {
    const { service, prisma, attachmentsService } = createService();

    prisma.tenant.findUnique.mockResolvedValue({ logoAttachmentId: 'old-logo' });
    prisma.attachment.findFirst.mockResolvedValue({ id: 'new-logo' });
    prisma.tenant.update.mockResolvedValue({ id: 'tenant-1', logoAttachmentId: 'new-logo' });

    await service.update('tenant-1', { logoAttachmentId: 'new-logo' }, 'user-1');

    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { logoAttachmentId: 'new-logo' },
    });
    expect(attachmentsService.deleteAttachment).toHaveBeenCalledWith(
      'tenant-1',
      'old-logo',
      'user-1',
    );
  });
});
