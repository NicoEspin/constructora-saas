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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier for the current tenant' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated supplier list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListSuppliersQueryDto) {
    return this.suppliersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.suppliersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier for the current tenant' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier for the current tenant' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.suppliersService.remove(tenantId, id, user.sub);
  }
}
