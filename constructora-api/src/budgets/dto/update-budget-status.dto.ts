import { ApiProperty } from '@nestjs/swagger';
import { BudgetStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBudgetStatusDto {
  @ApiProperty({ enum: BudgetStatus, description: 'Next budget status' })
  @IsEnum(BudgetStatus)
  status!: BudgetStatus;
}
