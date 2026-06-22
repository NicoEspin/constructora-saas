import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementUnit } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Cemento Portland', description: 'Material name' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Construccion', description: 'Material category' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @ApiProperty({ enum: MeasurementUnit, description: 'Measurement unit' })
  @IsEnum(MeasurementUnit)
  unit!: MeasurementUnit;

  @ApiPropertyOptional({
    example: 'supplier-id',
    description: 'Optional tenant-scoped supplier id',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @ApiPropertyOptional({ example: 12500.5, description: 'Estimated unit price' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedUnitPrice?: number | null;

  @ApiPropertyOptional({ example: 'Bolsa de 50kg', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
