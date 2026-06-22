import { ApiProperty } from '@nestjs/swagger';
import { ExpenseStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: ExpenseStatus, description: 'Expense status' })
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus;
}
