import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBudgetItemDto } from './create-budget-item.dto';

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Presupuesto refaccion cocina', description: 'Budget name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'client-id', description: 'Tenant-scoped client id' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'project-id', description: 'Optional tenant-scoped project id' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({ example: 'Refaccion', description: 'Budget work type' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  workType?: string | null;

  @ApiPropertyOptional({ example: 'Trabajo llave en mano', description: 'Budget description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Issued date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  issuedAt?: Date;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Expiration date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  expiresAt?: Date | null;

  @ApiPropertyOptional({ example: 10, description: 'Discount amount' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number | null;

  @ApiPropertyOptional({ example: 21, description: 'Tax amount' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number | null;

  @ApiPropertyOptional({ example: 50, description: 'Profit amount' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  profitAmount?: number | null;

  @ApiPropertyOptional({ example: 'Validez 15 dias', description: 'Commercial terms' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commercialTerms?: string | null;

  @ApiPropertyOptional({
    example: '50% anticipo, 50% contra entrega',
    description: 'Payment terms',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  paymentTerms?: string | null;

  @ApiPropertyOptional({ example: '20 dias corridos', description: 'Estimated execution time' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  estimatedExecutionTime?: string | null;

  @ApiPropertyOptional({ type: [CreateBudgetItemDto], description: 'Replace budget items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetItemDto)
  items?: CreateBudgetItemDto[];
}
