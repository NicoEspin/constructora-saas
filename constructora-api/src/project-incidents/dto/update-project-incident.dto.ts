import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProjectIncidentCategory } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProjectIncidentDto {
  @ApiPropertyOptional({ example: 'project-id', description: 'Tenant-scoped project id' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ example: '2026-06-17T00:00:00.000Z', description: 'Incident date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  incidentDate?: Date;

  @ApiPropertyOptional({ example: 'Lluvias intensas', description: 'Incident reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'project-stage-id', description: 'Optional related stage id' })
  @IsOptional()
  @IsUUID()
  projectStageId?: string | null;

  @ApiPropertyOptional({ enum: ProjectIncidentCategory, description: 'Incident category' })
  @IsOptional()
  @IsEnum(ProjectIncidentCategory)
  category?: ProjectIncidentCategory | null;

  @ApiPropertyOptional({ example: 2, description: 'Delay in full days' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsInt()
  @Min(0)
  delayDays?: number;

  @ApiPropertyOptional({ example: 6, description: 'Remaining delay hours' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : Number(value)))
  @IsInt()
  @Min(0)
  @Max(23)
  delayHours?: number;

  @ApiPropertyOptional({
    example: 'Se reprogramó la entrega de materiales',
    description: 'Internal notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
