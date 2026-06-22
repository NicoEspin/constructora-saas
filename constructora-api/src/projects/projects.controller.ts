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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ConvertBudgetToProjectDto } from './dto/convert-budget-to-project.dto';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { ApplyProjectTemplateDto } from './dto/apply-project-template.dto';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project for the current tenant' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List projects for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated project list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListProjectsQueryDto) {
    return this.projectsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectsService.findOne(tenantId, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get the enriched project summary for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project summary details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findSummary(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectsService.findSummary(tenantId, id);
  }

  @Post(':id/apply-template')
  @ApiOperation({ summary: 'Apply the linked project template to an existing project' })
  @ApiResponse({ status: 201, description: 'Project template applied successfully' })
  @ApiResponse({ status: 400, description: 'Project has no linked template' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async applyTemplate(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: ApplyProjectTemplateDto,
  ) {
    return this.projectsService.applyTemplate(tenantId, id, dto, user.sub);
  }

  @Get(':projectId/stages')
  @ApiOperation({ summary: 'List stages for a project in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project stages list' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findStages(@CurrentTenant() tenantId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findStages(tenantId, projectId);
  }

  @Post(':projectId/stages')
  @ApiOperation({ summary: 'Create a stage for a project in the current tenant' })
  @ApiResponse({ status: 201, description: 'Project stage created successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async createStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectStageDto,
  ) {
    return this.projectsService.createStage(tenantId, projectId, dto, user.sub);
  }

  @Get(':projectId/stages/:stageId')
  @ApiOperation({ summary: 'Get a project stage by ID in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project stage details' })
  @ApiResponse({ status: 404, description: 'Project stage not found' })
  async findStage(
    @CurrentTenant() tenantId: string,
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.projectsService.findStage(tenantId, projectId, stageId);
  }

  @Patch(':projectId/stages/:stageId')
  @ApiOperation({ summary: 'Update a project stage in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project stage updated successfully' })
  @ApiResponse({ status: 404, description: 'Project stage not found' })
  async updateStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateProjectStageDto,
  ) {
    return this.projectsService.updateStage(tenantId, projectId, stageId, dto, user.sub);
  }

  @Delete(':projectId/stages/:stageId')
  @ApiOperation({ summary: 'Delete a project stage in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project stage deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project stage not found' })
  async removeStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.projectsService.removeStage(tenantId, projectId, stageId, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(tenantId, id, user.sub);
  }

  @Post('from-budget/:budgetId')
  @ApiOperation({ summary: 'Convert an approved budget into a project for the current tenant' })
  @ApiResponse({ status: 201, description: 'Project created from budget successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async convertFromBudget(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('budgetId') budgetId: string,
    @Body() dto: ConvertBudgetToProjectDto,
  ) {
    return this.projectsService.convertFromBudget(tenantId, budgetId, dto, user.sub);
  }
}
