import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { VerificationUploadUrlDto } from './dto/upload-url.dto';
import { AttachDocumentDto } from './dto/attach-document.dto';
import { ReviewVerificationRequestDto } from './dto/review-request.dto';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Roles('PROVIDER')
  @Post('requests')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVerificationRequestDto) {
    return this.verification.createRequest(user.id, dto.type);
  }

  @Roles('PROVIDER')
  @Get('requests/mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.verification.listMine(user.id);
  }

  @Roles('PROVIDER')
  @Post('requests/:id/upload-url')
  uploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VerificationUploadUrlDto,
  ) {
    return this.verification.getUploadUrl(user.id, id, dto.contentType);
  }

  @Roles('PROVIDER')
  @Post('requests/:id/documents')
  attachDocument(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AttachDocumentDto) {
    return this.verification.attachDocument(user.id, id, dto.key, dto.fileType);
  }

  @Public()
  @Get('health-status/:providerId')
  healthStatus(@Param('providerId') providerId: string) {
    return this.verification.healthStatus(providerId);
  }

  @Roles('ADMIN')
  @Get('admin/queue')
  adminQueue(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.verification.adminListQueue(status);
  }

  @Roles('ADMIN')
  @Get('admin/documents/:id/url')
  adminDocumentUrl(@Param('id') id: string) {
    return this.verification.adminGetDocumentUrl(id);
  }

  @Roles('ADMIN')
  @Post('admin/requests/:id/review')
  @AuditLog({ action: 'VERIFICATION_REVIEWED', entityType: 'VerificationRequest' })
  adminReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationRequestDto,
  ) {
    return this.verification.adminReview(id, user.id, dto.status, dto.rejectionReason);
  }
}
