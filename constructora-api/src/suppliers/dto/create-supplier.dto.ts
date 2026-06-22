import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Hormigonera SA', description: 'Supplier name' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Hormigon elaborado', description: 'Supplier trade' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  trade?: string;

  @ApiPropertyOptional({ example: '+54 11 5555 5555', description: 'Supplier phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'ventas@hormigonera.com', description: 'Supplier email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ example: 'Ruta 8 km 40', description: 'Supplier address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '30-12345678-9', description: 'Supplier tax identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: 'Hormigon, arena y piedra', description: 'Supplier offerings' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  offerings?: string;

  @ApiPropertyOptional({ example: 'Entrega en 24hs', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
