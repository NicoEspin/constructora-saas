import { Module } from '@nestjs/common';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentPdfSettingsController } from './document-pdf-settings.controller';
import { DocumentPdfSettingsService } from './document-pdf-settings.service';

@Module({
  imports: [RbacModule, AttachmentsModule],
  controllers: [DocumentPdfSettingsController],
  providers: [DocumentPdfSettingsService, PrismaService, TenantContextService],
  exports: [DocumentPdfSettingsService],
})
export class DocumentPdfSettingsModule {}
