import { Module } from '@nestjs/common';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { ProjectIncomesController } from './project-incomes.controller';
import { ProjectIncomesService } from './project-incomes.service';

@Module({
  imports: [AttachmentsModule],
  controllers: [ProjectIncomesController],
  providers: [ProjectIncomesService, PrismaService, TenantGuard, TenantContextService],
  exports: [ProjectIncomesService],
})
export class ProjectIncomesModule {}
