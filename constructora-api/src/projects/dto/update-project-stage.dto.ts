import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProjectStageStatus } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProjectStageTaskDto } from './project-stage-task.dto';

export class UpdateProjectStageDto {
  @ApiPropertyOptional({ example: 'Fundaciones', description: 'Stage name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'Excavacion y bases', description: 'Stage description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: ProjectStageStatus, description: 'Stage status' })
  @IsOptional()
  @IsEnum(ProjectStageStatus)
  status?: ProjectStageStatus;

  @ApiPropertyOptional({ example: 40, description: 'Optional stage progress percent from 0 to 100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @ApiPropertyOptional({ example: 40, description: 'Optional stage weight percent from 0 to 100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weightPercent?: number | null;

  @ApiPropertyOptional({ example: 1, description: 'Optional stage position within the project' })
  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @ApiPropertyOptional({
    example: 'manager-user-id',
    description: 'Optional tenant-scoped manager user id',
  })
  @IsOptional()
  @IsUUID()
  managerUserId?: string | null;

  @ApiPropertyOptional({
    example: 'project-template-stage-id',
    description: 'Optional project template stage id compatible with the project template',
  })
  @IsOptional()
  @IsUUID()
  projectTemplateStageId?: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Estimated start date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  estimatedStartDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Estimated end date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  estimatedEndDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-06-18T00:00:00.000Z', description: 'Actual start date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  actualStartDate?: Date | null;

  @ApiPropertyOptional({ example: '2026-07-20T00:00:00.000Z', description: 'Actual end date' })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : new Date(value)))
  @IsDate()
  actualEndDate?: Date | null;

  @ApiPropertyOptional({ example: 'Coordinacion con contratista', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({
    type: [ProjectStageTaskDto],
    description: 'Optional materialized tasks for this project stage',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectStageTaskDto)
  tasks?: ProjectStageTaskDto[];
}
