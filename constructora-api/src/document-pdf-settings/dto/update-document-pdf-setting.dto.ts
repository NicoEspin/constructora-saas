import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentPdfLayout, DocumentPdfLogoSize, DocumentPdfType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class UpdateDocumentPdfSettingDto {
  @ApiProperty({
    enum: DocumentPdfLayout,
    example: DocumentPdfLayout.CLASSIC,
    description: 'General PDF layout preset',
  })
  @IsEnum(DocumentPdfLayout)
  layout!: DocumentPdfLayout;

  @ApiProperty({
    example: '#1D4ED8',
    description: 'Primary accent color used in the PDF template',
  })
  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
  primaryColor!: string;

  @ApiPropertyOptional({
    example: '8d290220-3a76-4e2a-ae91-12c53dce8f4b',
    nullable: true,
    description: 'Future logo attachment reference for the PDF template',
  })
  @IsOptional()
  @IsUUID()
  logoAttachmentId?: string | null;

  @ApiProperty({
    enum: DocumentPdfLogoSize,
    example: DocumentPdfLogoSize.MEDIUM,
    description: 'Display size of the logo within the PDF template',
  })
  @IsEnum(DocumentPdfLogoSize)
  logoSize!: DocumentPdfLogoSize;
}

export class DocumentPdfSettingResponseDto {
  @ApiProperty({ example: '7ef5c3f9-0b56-44c7-b77b-cdceb3e5a275', nullable: true })
  id!: string | null;

  @ApiProperty({ example: 'tenant-id' })
  tenantId!: string;

  @ApiProperty({ enum: DocumentPdfType, example: DocumentPdfType.BUDGET })
  documentType!: DocumentPdfType;

  @ApiProperty({ enum: DocumentPdfLayout, example: DocumentPdfLayout.CLASSIC })
  layout!: DocumentPdfLayout;

  @ApiProperty({ example: '#1D4ED8' })
  primaryColor!: string;

  @ApiPropertyOptional({ nullable: true })
  logoAttachmentId!: string | null;

  @ApiProperty({ enum: DocumentPdfLogoSize, example: DocumentPdfLogoSize.MEDIUM })
  logoSize!: DocumentPdfLogoSize;

  @ApiPropertyOptional({ nullable: true })
  tenantLogoAttachmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  effectiveLogoAttachmentId!: string | null;

  @ApiProperty({ enum: ['DOCUMENT', 'TENANT', 'NONE'] })
  effectiveLogoSource!: 'DOCUMENT' | 'TENANT' | 'NONE';

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiPropertyOptional({ nullable: true })
  createdAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  updatedAt!: Date | null;
}
