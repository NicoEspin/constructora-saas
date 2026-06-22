import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateProjectIncomeDto } from './dto/create-project-income.dto';
import { ListProjectIncomesQueryDto } from './dto/list-project-incomes-query.dto';
import { UpdateProjectIncomeDto } from './dto/update-project-income.dto';
import { ProjectIncomesService } from './project-incomes.service';

@ApiTags('Project Incomes')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('project-incomes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectIncomesController {
  constructor(private readonly projectIncomesService: ProjectIncomesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project income for the current tenant' })
  @ApiResponse({ status: 201, description: 'Project income created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateProjectIncomeDto,
  ) {
    return this.projectIncomesService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List project incomes for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated project incomes list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListProjectIncomesQueryDto) {
    return this.projectIncomesService.findAll(tenantId, query);
  }

  @Get('summary/monthly')
  @ApiOperation({
    summary: 'Get current vs previous month confirmed income totals for the current tenant',
  })
  @ApiResponse({ status: 200, description: 'Monthly project income summary' })
  async getMonthlySummary(@CurrentTenant() tenantId: string) {
    return this.projectIncomesService.getMonthlySummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project income by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project income details' })
  @ApiResponse({ status: 404, description: 'Project income not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectIncomesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project income for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project income updated successfully' })
  @ApiResponse({ status: 404, description: 'Project income not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectIncomeDto,
  ) {
    return this.projectIncomesService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project income for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project income deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project income not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.projectIncomesService.remove(tenantId, id, user.sub);
  }
}
