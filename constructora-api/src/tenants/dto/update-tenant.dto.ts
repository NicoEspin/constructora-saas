import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const Plan = {
  FREE: 'FREE',
  PRO: 'PRO',
} as const;

const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

type PlanType = (typeof Plan)[keyof typeof Plan];
type TenantStatusType = (typeof TenantStatus)[keyof typeof TenantStatus];

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'New Name', maxLength: 100, description: 'Organization name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ['FREE', 'PRO'], description: 'Subscription plan' })
  @IsOptional()
  @IsEnum(Plan)
  plan?: PlanType;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'], description: 'Tenant status' })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatusType;

  @ApiPropertyOptional({
    example: '8d290220-3a76-4e2a-ae91-12c53dce8f4b',
    nullable: true,
    description: 'Logo attachment reference for the tenant brand',
  })
  @IsOptional()
  @IsUUID()
  logoAttachmentId?: string | null;
}
