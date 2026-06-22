import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentKind } from '@prisma/client';

export class AttachmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ nullable: true })
  uploadedByUserId!: string | null;

  @ApiProperty({ enum: AttachmentKind })
  kind!: AttachmentKind;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fileSizeBytes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expenseId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  projectId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  projectIncomeId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  projectStageId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  budgetId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AttachmentAccessResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  expiresAt!: string;
}
