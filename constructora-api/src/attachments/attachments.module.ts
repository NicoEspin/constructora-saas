import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RbacModule } from '../rbac/rbac.module';
import { StorageModule } from '../storage/storage.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [StorageModule, AuditModule, RbacModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, PrismaService, TenantGuard],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
