import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional({ example: 'Materiales', description: 'Expense category name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Compras de obra y consumibles',
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ example: '#F97316', description: 'Optional hex color for UI clients' })
  @IsOptional()
  @IsString()
  @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
  color?: string | null;
}
