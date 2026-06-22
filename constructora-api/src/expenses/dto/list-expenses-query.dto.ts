import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ListExpensesQueryDto {
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

  @ApiPropertyOptional({ enum: ExpenseStatus, description: 'Filter by expense status' })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ example: 'expense-category-id', description: 'Filter by category id' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'project-id', description: 'Filter by project id' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ example: 'project-stage-id', description: 'Filter by project stage id' })
  @IsOptional()
  @IsUUID()
  projectStageId?: string;

  @ApiPropertyOptional({ example: 'supplier-id', description: 'Filter by supplier id' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({
    example: 'hormigon',
    description: 'Search by description, supplier, category or project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}
