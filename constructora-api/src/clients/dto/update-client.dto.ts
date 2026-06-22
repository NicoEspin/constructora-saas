import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Acme SA', description: 'Client name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '+54 11 5555 5555', description: 'Client phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@acme.com', description: 'Client email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123', description: 'Client address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '30-12345678-9', description: 'Client tax identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: 'Cliente prioritario', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
