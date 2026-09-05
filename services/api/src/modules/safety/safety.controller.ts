import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateTrustedContactDto } from './dto/trusted-contact.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { EmergencyAlertDto } from './dto/emergency-alert.dto';
import { CheckInDto } from './dto/checkin.dto';
import { IsIn } from 'class-validator';

class ResolveReportDto {
  @IsIn(['RESOLVED', 'DISMISSED'])
  status!: 'RESOLVED' | 'DISMISSED';
}

@ApiTags('safety')
@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('trusted-contacts')
  addTrustedContact(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTrustedContactDto) {
    return this.safety.addTrustedContact(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('trusted-contacts')
  listTrustedContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.safety.listTrustedContacts(user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Delete('trusted-contacts/:id')
  deleteTrustedContact(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.safety.deleteTrustedContact(user.id, id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('block')
  block(@CurrentUser() user: AuthenticatedUser, @Body() dto: BlockUserDto) {
    return this.safety.blockUser(user.id, dto.userId);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('unblock')
  unblock(@CurrentUser() user: AuthenticatedUser, @Body() dto: BlockUserDto) {
    return this.safety.unblockUser(user.id, dto.userId);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('blocked')
  listBlocked(@CurrentUser() user: AuthenticatedUser) {
    return this.safety.listBlocked(user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('report')
  reportUser(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportUserDto) {
    return this.safety.reportUser(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('emergency-alerts')
  createAlert(@CurrentUser() user: AuthenticatedUser, @Body() dto: EmergencyAlertDto) {
    return this.safety.createEmergencyAlert(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('emergency-alerts/mine')
  myAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.safety.listMyAlerts(user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('check-in')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.safety.checkIn(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER', 'ADMIN')
  @Get('check-in/:bookingId')
  listCheckIns(@Param('bookingId') bookingId: string) {
    return this.safety.listCheckIns(bookingId);
  }

  @Roles('ADMIN')
  @Get('admin/reports')
  adminReports(@Query('status') status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') {
    return this.safety.adminListReports(status);
  }

  @Roles('ADMIN')
  @Post('admin/reports/:id/resolve')
  resolveReport(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.safety.resolveReport(id, user.id, dto.status);
  }

  @Roles('ADMIN')
  @Get('admin/emergency-alerts')
  adminAlerts(@Query('status') status?: 'OPEN' | 'RESOLVED') {
    return this.safety.adminListAlerts(status);
  }

  @Roles('ADMIN')
  @Post('admin/emergency-alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    return this.safety.resolveEmergencyAlert(id);
  }
}
