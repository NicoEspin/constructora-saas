import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { ProjectTemplatesController } from './project-templates.controller';
import { ProjectTemplatesService } from './project-templates.service';

@Module({
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService, PrismaService, TenantGuard, TenantContextService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}
