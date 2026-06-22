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
import { CreateProjectIncidentDto } from './dto/create-project-incident.dto';
import { ListProjectIncidentsQueryDto } from './dto/list-project-incidents-query.dto';
import { UpdateProjectIncidentDto } from './dto/update-project-incident.dto';
import { ProjectIncidentsService } from './project-incidents.service';

@ApiTags('Project Incidents')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('project-incidents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectIncidentsController {
  constructor(private readonly projectIncidentsService: ProjectIncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project incident for the current tenant' })
  @ApiResponse({ status: 201, description: 'Project incident created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateProjectIncidentDto,
  ) {
    return this.projectIncidentsService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List project incidents for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated project incidents list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListProjectIncidentsQueryDto) {
    return this.projectIncidentsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project incident by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project incident details' })
  @ApiResponse({ status: 404, description: 'Project incident not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.projectIncidentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project incident for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project incident updated successfully' })
  @ApiResponse({ status: 404, description: 'Project incident not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateProjectIncidentDto,
  ) {
    return this.projectIncidentsService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project incident for the current tenant' })
  @ApiResponse({ status: 200, description: 'Project incident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project incident not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.projectIncidentsService.remove(tenantId, id, user.sub);
  }
}
