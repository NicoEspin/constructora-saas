import { InternalServerErrorException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects placeholder R2 credentials before generating upload URLs', async () => {
    process.env.R2_ACCOUNT_ID = 'account-id';
    process.env.R2_BUCKET_NAME = 'constructora';
    process.env.R2_ACCESS_KEY_ID = 'tu_access_key_id';
    process.env.R2_SECRET_ACCESS_KEY = 'tu_secret_access_key';

    const service = new StorageService();

    await expect(
      service.createSignedUploadUrl({
        key: 'tenants/tenant-1/expense/expense-1/file.pdf',
        contentType: 'application/pdf',
      }),
    ).rejects.toEqual(
      new InternalServerErrorException(
        'R2_ACCESS_KEY_ID is using a placeholder value and must be replaced for attachment storage',
      ),
    );
  });

  it('signs upload URLs with the configured R2 access key', async () => {
    process.env.R2_ACCOUNT_ID = 'account-id';
    process.env.R2_BUCKET_NAME = 'constructora';
    process.env.R2_ACCESS_KEY_ID = 'real-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'real-secret-key';

    const service = new StorageService();
    const result = await service.createSignedUploadUrl({
      key: 'tenants/tenant-1/expense/expense-1/file.png',
      contentType: 'image/png',
      expiresInSeconds: 60,
    });

    const url = new URL(result.url);

    expect(url.searchParams.get('X-Amz-Credential')).toContain('real-access-key/');
  });
});
