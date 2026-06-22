import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListExpenseCategoriesQueryDto {
  @ApiPropertyOptional({
    example: 'material',
    description: 'Search by category name or description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
