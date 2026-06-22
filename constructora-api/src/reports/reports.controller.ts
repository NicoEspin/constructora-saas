import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:id/operational')
  @ApiOperation({ summary: 'Get the operational project report for the current tenant' })
  @ApiResponse({ status: 200, description: 'Operational project report payload' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectOperationalReport(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.reportsService.getProjectOperationalReport(tenantId, id);
  }

  @Get('projects/:id/executive')
  @ApiOperation({ summary: 'Get the executive project report for the current tenant' })
  @ApiResponse({ status: 200, description: 'Executive project report payload' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectExecutiveReport(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.reportsService.getProjectExecutiveReport(tenantId, id);
  }
}
