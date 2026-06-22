import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaymentMethod, ProjectIncomeStatus } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectIncomeDto {
  @ApiProperty({ example: 'project-id', description: 'Tenant-scoped project id' })
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional({ example: '2026-06-17T00:00:00.000Z', description: 'Income received date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  receivedAt?: Date;

  @ApiProperty({ example: 1500000, description: 'Collected amount' })
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ enum: ProjectIncomeStatus, description: 'Income status' })
  @IsOptional()
  @IsEnum(ProjectIncomeStatus)
  status?: ProjectIncomeStatus;

  @ApiPropertyOptional({
    example: 'budget-id',
    description: 'Optional tenant-scoped related budget id',
  })
  @IsOptional()
  @IsUUID()
  budgetId?: string | null;

  @ApiPropertyOptional({
    example: 'Anticipo inicial del cliente',
    description: 'Income description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method used' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;

  @ApiPropertyOptional({ example: 'REC-001', description: 'Optional internal reference' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string | null;

  @ApiPropertyOptional({
    example: 'Cobro correspondiente a avance de obra',
    description: 'Internal notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
