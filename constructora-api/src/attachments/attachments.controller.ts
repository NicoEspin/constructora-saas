import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AttachmentsService } from './attachments.service';
import { AttachmentAccessResponseDto, AttachmentResponseDto } from './dto/attachment-response.dto';
import {
  AttachmentAccessQueryDto,
  ListAttachmentsQueryDto,
} from './dto/list-attachments-query.dto';
import {
  AttachmentUploadUrlResponseDto,
  FinalizeAttachmentUploadDto,
  RequestAttachmentUploadDto,
  UploadImageAttachmentDto,
} from './dto/request-attachment-upload.dto';

type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('Attachments')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('attachments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Request a presigned upload URL for a tenant-scoped attachment' })
  @ApiResponse({ status: 201, type: AttachmentUploadUrlResponseDto })
  async requestUploadUrl(
    @CurrentTenant() tenantId: string,
    @Body() dto: RequestAttachmentUploadDto,
  ) {
    return this.attachmentsService.requestUploadUrl(tenantId, dto);
  }

  @Post('image-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload, optimize, and persist a tenant-scoped image attachment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['entityType', 'kind', 'file'],
      properties: {
        entityType: { type: 'string' },
        entityId: { type: 'string', format: 'uuid', nullable: true },
        documentType: { type: 'string', nullable: true },
        kind: { type: 'string' },
        notes: { type: 'string', nullable: true },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: AttachmentResponseDto })
  async uploadImage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UploadImageAttachmentDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.attachmentsService.uploadImageAttachment(tenantId, dto, file, user.sub);
  }

  @Post('finalize')
  @ApiOperation({ summary: 'Finalize an uploaded object and persist the attachment metadata' })
  @ApiResponse({ status: 201, type: AttachmentResponseDto })
  async finalizeUpload(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: FinalizeAttachmentUploadDto,
  ) {
    return this.attachmentsService.finalizeUpload(tenantId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List tenant-scoped attachments for a supported entity' })
  @ApiResponse({ status: 200, type: AttachmentResponseDto, isArray: true })
  async list(@CurrentTenant() tenantId: string, @Query() query: ListAttachmentsQueryDto) {
    return this.attachmentsService.listByEntity(tenantId, query);
  }

  @Get(':id/access-url')
  @ApiOperation({ summary: 'Request a signed private access URL for an attachment' })
  @ApiResponse({ status: 200, type: AttachmentAccessResponseDto })
  async getAccessUrl(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query() query: AttachmentAccessQueryDto,
  ) {
    return this.attachmentsService.getSignedAccessUrl(tenantId, id, query.download === true);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant-scoped attachment and its private object' })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.attachmentsService.deleteAttachment(tenantId, id, user.sub);
  }
}
