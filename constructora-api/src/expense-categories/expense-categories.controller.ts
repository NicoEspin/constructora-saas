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
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ListExpenseCategoriesQueryDto } from './dto/list-expense-categories-query.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategoriesService } from './expense-categories.service';

@ApiTags('Expense Categories')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('expense-categories')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense category for the current tenant' })
  @ApiResponse({ status: 201, description: 'Expense category created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.expenseCategoriesService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List expense categories for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense categories list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListExpenseCategoriesQueryDto) {
    return this.expenseCategoriesService.findAll(tenantId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense category for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense category updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense category not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.expenseCategoriesService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense category for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense category not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.expenseCategoriesService.remove(tenantId, id, user.sub);
  }
}
