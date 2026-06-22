import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { ProjectIncidentsController } from './project-incidents.controller';
import { ProjectIncidentsService } from './project-incidents.service';

@Module({
  controllers: [ProjectIncidentsController],
  providers: [ProjectIncidentsService, PrismaService, TenantGuard, TenantContextService],
  exports: [ProjectIncidentsService],
})
export class ProjectIncidentsModule {}
