import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetItemCategory, MeasurementUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateBudgetItemDto {
  @ApiProperty({ enum: BudgetItemCategory, description: 'Budget item category' })
  @IsEnum(BudgetItemCategory)
  category!: BudgetItemCategory;

  @ApiProperty({ example: 'Cemento portland', description: 'Budget item name' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Bolsa de 50kg', description: 'Budget item description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: 'material-id', description: 'Optional related material id' })
  @IsOptional()
  @IsUUID()
  materialId?: string | null;

  @ApiProperty({ example: 10, description: 'Quantity for the budget item' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantity!: number;

  @ApiProperty({ enum: MeasurementUnit, description: 'Measurement unit' })
  @IsEnum(MeasurementUnit)
  unit!: MeasurementUnit;

  @ApiProperty({ example: 100.5, description: 'Unit price for the budget item' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
