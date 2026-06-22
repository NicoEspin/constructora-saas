import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { DocumentPdfType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { AttachmentEntityType } from '../attachments.constants';

export class ListAttachmentsQueryDto {
  @ApiProperty({ enum: AttachmentEntityType })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty({ required: false })
  @ValidateIf(
    (dto: ListAttachmentsQueryDto) => dto.entityType !== AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsUUID()
  entityId?: string;

  @ApiProperty({ enum: DocumentPdfType, required: false })
  @IsOptional()
  @ValidateIf(
    (dto: ListAttachmentsQueryDto) => dto.entityType === AttachmentEntityType.DOCUMENT_PDF_SETTING,
  )
  @IsEnum(DocumentPdfType)
  documentType?: DocumentPdfType;
}

export class AttachmentAccessQueryDto {
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  download?: boolean;
}
