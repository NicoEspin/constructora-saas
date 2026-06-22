import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, PrismaService, TenantGuard, TenantContextService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
