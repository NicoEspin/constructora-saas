import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService, PrismaService, TenantGuard, TenantContextService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
