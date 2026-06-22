import { ApiProperty } from '@nestjs/swagger';
import { AttachmentKind, DocumentPdfType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { AttachmentEntityType } from '../attachments.constants';

export class RequestAttachmentUploadDto {
  @ApiProperty({ enum: AttachmentEntityType })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty({ enum: AttachmentKind })
  @IsEnum(AttachmentKind)
  kind!: AttachmentKind;

  @ApiProperty({ example: 'factura-hormigon.pdf' })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ example: 245760 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  fileSizeBytes!: number;

  @ApiProperty({ example: 'cb0ad31e-4f5c-4d8f-a1e4-b44af6448871', required: false })
  @ValidateIf(
    (dto: RequestAttachmentUploadDto) =>
      dto.entityType !== AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsUUID()
  entityId?: string;

  @ApiProperty({ enum: DocumentPdfType, required: false })
  @IsOptional()
  @ValidateIf(
    (dto: RequestAttachmentUploadDto) =>
      dto.entityType === AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsEnum(DocumentPdfType)
  documentType?: DocumentPdfType;
}

export class FinalizeAttachmentUploadDto extends RequestAttachmentUploadDto {
  @ApiProperty({ example: 'tenants/tenant-id/expense/expense-id/uuid-factura-hormigon.pdf' })
  @IsString()
  @MaxLength(1024)
  storageKey!: string;

  @ApiProperty({ example: 'Comprobante de pago junio', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UploadImageAttachmentDto {
  @ApiProperty({ enum: AttachmentEntityType })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty({ enum: AttachmentKind })
  @IsEnum(AttachmentKind)
  kind!: AttachmentKind;

  @ApiProperty({ example: 'cb0ad31e-4f5c-4d8f-a1e4-b44af6448871', required: false })
  @ValidateIf(
    (dto: UploadImageAttachmentDto) => dto.entityType !== AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsUUID()
  entityId?: string;

  @ApiProperty({ enum: DocumentPdfType, required: false })
  @IsOptional()
  @ValidateIf(
    (dto: UploadImageAttachmentDto) => dto.entityType === AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsEnum(DocumentPdfType)
  documentType?: DocumentPdfType;

  @ApiProperty({ example: 'Fachada norte', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AttachmentUploadUrlResponseDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty({ type: Object })
  requiredHeaders!: Record<string, string>;

  @ApiProperty()
  expiresAt!: string;
}
