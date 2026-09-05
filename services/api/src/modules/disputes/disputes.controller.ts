import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Roles('CUSTOMER', 'PROVIDER')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeDto) {
    return this.disputes.create(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.disputes.listMine(user.id);
  }

  @Roles('ADMIN')
  @Get('admin')
  adminList(@Query('status') status?: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED') {
    return this.disputes.adminList(status);
  }

  @Roles('ADMIN')
  @Post(':id/resolve')
  @AuditLog({ action: 'DISPUTE_RESOLVED', entityType: 'Dispute' })
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(id, user.id, dto);
  }
}
