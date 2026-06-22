import { Module } from '@nestjs/common';
import { AttachmentsModule } from '../attachments/attachments.module';
import { RbacModule } from '../rbac/rbac.module';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { TenantGuard } from '../common/guards/tenant.guard';

@Module({
  imports: [AttachmentsModule, RbacModule],
  controllers: [TenantsController],
  providers: [TenantsService, PrismaService, TenantContextService, TenantGuard],
  exports: [TenantsService],
})
export class TenantsModule {}
