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
import { CreateMaterialDto } from './dto/create-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials-query.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('materials')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a material for the current tenant' })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateMaterialDto,
  ) {
    return this.materialsService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List materials for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated material list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListMaterialsQueryDto) {
    return this.materialsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a material by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Material details' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.materialsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a material for the current tenant' })
  @ApiResponse({ status: 200, description: 'Material updated successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a material for the current tenant' })
  @ApiResponse({ status: 200, description: 'Material deleted successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.materialsService.remove(tenantId, id, user.sub);
  }
}
