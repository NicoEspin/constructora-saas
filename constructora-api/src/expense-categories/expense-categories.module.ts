import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  controllers: [ExpenseCategoriesController],
  providers: [ExpenseCategoriesService, PrismaService, TenantGuard, TenantContextService],
  exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule {}
