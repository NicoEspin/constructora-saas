import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  controllers: [MaterialsController],
  providers: [MaterialsService, PrismaService, TenantGuard, TenantContextService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
