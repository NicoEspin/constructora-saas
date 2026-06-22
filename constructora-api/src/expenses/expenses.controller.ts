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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('expenses')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense for the current tenant' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses for the current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated expenses list' })
  async findAll(@CurrentTenant() tenantId: string, @Query() query: ListExpensesQueryDto) {
    return this.expensesService.findAll(tenantId, query);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Get current vs previous month expense totals for the current tenant' })
  @ApiResponse({ status: 200, description: 'Monthly expense summary' })
  async getMonthlySummary(@CurrentTenant() tenantId: string) {
    return this.expensesService.getMonthlySummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense details' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.expensesService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update expense status for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense status updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    return this.expensesService.updateStatus(tenantId, id, dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense for the current tenant' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(tenantId, id, user.sub);
  }
}
