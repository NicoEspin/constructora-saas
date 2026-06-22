import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectTemplateDto {
  @ApiProperty({ example: 'Obra residencial estandar', description: 'Project template name' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    example: 'Plantilla base para obras residenciales pequenas',
    description: 'Optional project template description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}
