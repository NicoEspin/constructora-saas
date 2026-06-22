import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ProjectTemplateStageTaskDto {
  @ApiProperty({
    example: 'Verificar sector a demoler según plano o indicación.',
    description: 'Default task title for the template stage',
  })
  @IsString()
  @MaxLength(240)
  title!: string;
}
