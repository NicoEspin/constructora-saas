import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProjectStageTaskDto {
  @ApiProperty({
    example: 'Verificar sector a demoler según plano o indicación.',
    description: 'Task title for the project stage',
  })
  @IsString()
  @MaxLength(240)
  title!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the task is completed',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
