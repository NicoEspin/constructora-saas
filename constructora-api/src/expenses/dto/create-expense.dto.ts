import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ExpenseStatus, PaymentMethod } from '@prisma/client';
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

export class CreateExpenseDto {
  @ApiProperty({ example: 'expense-category-id', description: 'Tenant-scoped expense category id' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'project-id', description: 'Optional tenant-scoped project id' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({
    example: 'project-stage-id',
    description: 'Optional tenant-scoped project stage id',
  })
  @IsOptional()
  @IsUUID()
  projectStageId?: string | null;

  @ApiPropertyOptional({
    example: 'supplier-id',
    description: 'Optional tenant-scoped supplier id',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Expense date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  expenseDate?: Date;

  @ApiPropertyOptional({ example: '2026-06-20T00:00:00.000Z', description: 'Expense due date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  dueDate?: Date | null;

  @ApiProperty({ example: 1250.5, description: 'Expense amount' })
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    example: 'Compra de hormigon para fundaciones',
    description: 'Expense description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;

  @ApiPropertyOptional({
    enum: ExpenseStatus,
    description: 'Expense status',
    default: ExpenseStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
