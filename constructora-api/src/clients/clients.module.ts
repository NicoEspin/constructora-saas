import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, TenantGuard, TenantContextService],
  exports: [ClientsService],
})
export class ClientsModule {}
