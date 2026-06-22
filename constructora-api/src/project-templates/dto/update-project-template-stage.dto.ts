import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProjectTemplateStageTaskDto } from './project-template-stage-task.dto';

export class UpdateProjectTemplateStageDto {
  @ApiPropertyOptional({ example: 'Fundaciones', description: 'Project template stage name' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({
    example: 'Excavacion, bases y replanteo',
    description: 'Optional project template stage description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'Optional stage position within the template' })
  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @ApiPropertyOptional({ example: 40, description: 'Optional stage weight percent from 0 to 100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weightPercent?: number | null;

  @ApiPropertyOptional({
    type: [ProjectTemplateStageTaskDto],
    description: 'Optional default tasks for this template stage',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTemplateStageTaskDto)
  tasks?: ProjectTemplateStageTaskDto[];
}
