import { Module } from '@nestjs/common';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PrismaService } from '../common/prisma.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [AttachmentsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, TenantGuard, TenantContextService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
