import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProjectsModule } from '../projects/projects.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [ProjectsModule],
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
})
export class ReportsModule {}
