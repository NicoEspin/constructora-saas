import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProjectStatus } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Obra Barrio Norte', description: 'Project name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'client-id', description: 'Optional tenant-scoped client id' })
  @IsOptional()
  @IsUUID()
  clientId?: string | null;

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

  @ApiPropertyOptional({ example: 'Av. Central 123', description: 'Project location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Start date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  startDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-06-18T00:00:00.000Z', description: 'Actual start date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  actualStartDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-12-15T00:00:00.000Z', description: 'Estimated end date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  estimatedEndDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-12-20T00:00:00.000Z', description: 'Actual end date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  actualEndDate?: Date | null;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Project status' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: 'Observaciones actualizadas', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
