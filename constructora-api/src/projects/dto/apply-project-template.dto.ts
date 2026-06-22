import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ApplyProjectTemplateDto {
  @ApiPropertyOptional({
    example: 'append',
    description: 'Template application mode. Only append is supported.',
    default: 'append',
  })
  @IsOptional()
  @IsIn(['append'])
  mode?: 'append' = 'append' as const;
}
