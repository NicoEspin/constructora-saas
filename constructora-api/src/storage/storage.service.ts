import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

type SignedUploadInput = {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
};

type SignedAccessInput = {
  key: string;
  fileName: string;
  mimeType?: string | null;
  download?: boolean;
  expiresInSeconds?: number;
};

type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

@Injectable()
export class StorageService {
  private client: S3Client | null = null;
  private static readonly placeholderEnvValues = new Set([
    'tu_access_key_id',
    'tu_secret_access_key',
  ]);

  async createSignedUploadUrl(input: SignedUploadInput) {
    const expiresInSeconds = input.expiresInSeconds ?? 300;
    const command = new PutObjectCommand({
      Bucket: this.getBucketName(),
      Key: input.key,
      ContentType: input.contentType,
    });

    const url = await getSignedUrl(this.getClient(), command, { expiresIn: expiresInSeconds });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      requiredHeaders: {
        'Content-Type': input.contentType,
      },
    };
  }

  async createSignedAccessUrl(input: SignedAccessInput) {
    const expiresInSeconds = input.expiresInSeconds ?? 300;
    const contentDisposition = `${input.download ? 'attachment' : 'inline'}; filename="${this.escapeFileName(input.fileName)}"`;
    const command = new GetObjectCommand({
      Bucket: this.getBucketName(),
      Key: input.key,
      ResponseContentDisposition: contentDisposition,
      ...(input.mimeType ? { ResponseContentType: input.mimeType } : {}),
    });

    const url = await getSignedUrl(this.getClient(), command, { expiresIn: expiresInSeconds });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async getObjectMetadata(key: string) {
    try {
      const response = await this.getClient().send(
        new HeadObjectCommand({
          Bucket: this.getBucketName(),
          Key: key,
        }),
      );

      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? null,
      };
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException('Uploaded object not found in storage');
      }

      throw new InternalServerErrorException('Could not inspect uploaded object');
    }
  }

  async uploadObject(input: UploadObjectInput) {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async deleteObject(key: string) {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
      }),
    );
  }

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const accountId = this.getRequiredEnv('R2_ACCOUNT_ID');
    const accessKeyId = this.getRequiredEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredEnv('R2_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.client;
  }

  private getBucketName() {
    return this.getRequiredEnv('R2_BUCKET_NAME');
  }

  private getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new InternalServerErrorException(`${name} is required for attachment storage`);
    }

    if (StorageService.placeholderEnvValues.has(value)) {
      throw new InternalServerErrorException(
        `${name} is using a placeholder value and must be replaced for attachment storage`,
      );
    }

    return value;
  }

  private escapeFileName(fileName: string) {
    return fileName.replace(/"/g, '');
  }

  private isNotFoundError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('$metadata' in error || 'name' in error) &&
      ((error as { name?: string }).name === 'NotFound' ||
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
    );
  }
}
