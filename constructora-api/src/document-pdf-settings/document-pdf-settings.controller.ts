import { Body, Controller, Get, Param, ParseEnumPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DocumentPdfType } from '@prisma/client';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import {
  DocumentPdfSettingResponseDto,
  UpdateDocumentPdfSettingDto,
} from './dto/update-document-pdf-setting.dto';
import { DocumentPdfSettingsService } from './document-pdf-settings.service';

@ApiTags('Document PDF Settings')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('document-pdf-settings')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class DocumentPdfSettingsController {
  constructor(private readonly documentPdfSettingsService: DocumentPdfSettingsService) {}

  @Get(':documentType')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get PDF settings for a document type in the current tenant' })
  @ApiResponse({ status: 200, type: DocumentPdfSettingResponseDto })
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('documentType', new ParseEnumPipe(DocumentPdfType)) documentType: DocumentPdfType,
  ) {
    return this.documentPdfSettingsService.findOne(tenantId, documentType);
  }

  @Put(':documentType')
  @RequirePermissions('settings.write')
  @ApiOperation({
    summary: 'Create or update PDF settings for a document type in the current tenant',
  })
  @ApiResponse({ status: 200, type: DocumentPdfSettingResponseDto })
  async upsert(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('documentType', new ParseEnumPipe(DocumentPdfType)) documentType: DocumentPdfType,
    @Body() dto: UpdateDocumentPdfSettingDto,
  ) {
    return this.documentPdfSettingsService.upsert(tenantId, documentType, dto, user.sub);
  }
}
