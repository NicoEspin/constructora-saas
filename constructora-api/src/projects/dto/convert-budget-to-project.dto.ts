import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ConvertBudgetToProjectDto {
  @ApiPropertyOptional({
    example: 'Obra Presupuesto Casa Lago',
    description: 'Optional project name override',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({
    example: 'project-template-id',
    description: 'Optional tenant-scoped project template id',
  })
  @IsOptional()
  @IsUUID()
  projectTemplateId?: string | null;

  @ApiPropertyOptional({
    example: 'manager-user-id',
    description: 'Optional tenant-scoped manager user id',
  })
  @IsOptional()
  @IsUUID()
  managerUserId?: string | null;

  @ApiPropertyOptional({ example: 'Ruta 9 km 10', description: 'Project location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Start date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  startDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-12-15T00:00:00.000Z', description: 'Estimated end date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  estimatedEndDate?: Date | null;

  @ApiPropertyOptional({
    example: 'Creado desde presupuesto aprobado',
    description: 'Internal notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
