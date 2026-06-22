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
import { CreateProjectTemplateStageDto } from './dto/create-project-template-stage.dto';
import { CreateProjectTemplateDto } from './dto/create-project-template.dto';
import { ListProjectTemplatesQueryDto } from './dto/list-project-templates-query.dto';
import { UpdateProjectTemplateStageDto } from './dto/update-project-template-stage.dto';
import { UpdateProjectTemplateDto } from './dto/update-project-template.dto';
import { ProjectTemplatesService } from './project-templates.service';

@ApiTags('Project Templates')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('project-templates')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectTemplatesController {
  constructor(private readonly projectTemplatesService: ProjectTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project template for the current tenant' })
  @ApiResponse({ status: 201, description: 'Project template created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateProjectTemplateDto,
  ) {
    return this.projectTemplatesService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List project templates for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated project template list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListProjectTemplatesQueryDto) {
    return this.projectTemplatesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project template by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template details' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectTemplatesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project template for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template updated successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectTemplateDto,
  ) {
    return this.projectTemplatesService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project template for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.projectTemplatesService.remove(tenantId, id, user.sub);
  }

  @Get(':templateId/stages')
  @ApiOperation({ summary: 'List stages for a project template in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template stages list' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  async findStages(@CurrentTenant() tenantId: string, @Param('templateId') templateId: string) {
    return this.projectTemplatesService.findStages(tenantId, templateId);
  }

  @Post(':templateId/stages')
  @ApiOperation({ summary: 'Create a stage for a project template in the current tenant' })
  @ApiResponse({ status: 201, description: 'Project template stage created successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  async createStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('templateId') templateId: string,
    @Body() dto: CreateProjectTemplateStageDto,
  ) {
    return this.projectTemplatesService.createStage(tenantId, templateId, dto, user.sub);
  }

  @Get(':templateId/stages/:stageId')
  @ApiOperation({ summary: 'Get a project template stage by ID in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template stage details' })
  @ApiResponse({ status: 404, description: 'Project template stage not found' })
  async findStage(
    @CurrentTenant() tenantId: string,
    @Param('templateId') templateId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.projectTemplatesService.findStage(tenantId, templateId, stageId);
  }

  @Patch(':templateId/stages/:stageId')
  @ApiOperation({ summary: 'Update a project template stage in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template stage updated successfully' })
  @ApiResponse({ status: 404, description: 'Project template stage not found' })
  async updateStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('templateId') templateId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateProjectTemplateStageDto,
  ) {
    return this.projectTemplatesService.updateStage(tenantId, templateId, stageId, dto, user.sub);
  }

  @Delete(':templateId/stages/:stageId')
  @ApiOperation({ summary: 'Delete a project template stage in the current tenant' })
  @ApiResponse({ status: 200, description: 'Project template stage deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project template stage not found' })
  async removeStage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('templateId') templateId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.projectTemplatesService.removeStage(tenantId, templateId, stageId, user.sub);
  }
}
