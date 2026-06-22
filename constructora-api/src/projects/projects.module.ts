import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService, TenantGuard, TenantContextService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
