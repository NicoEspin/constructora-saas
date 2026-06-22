import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ListBudgetsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  @ApiPropertyOptional({ enum: BudgetStatus, description: 'Filter by budget status' })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiPropertyOptional({ example: 'client-id', description: 'Filter by client id' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'cocina', description: 'Search by budget name or client name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
