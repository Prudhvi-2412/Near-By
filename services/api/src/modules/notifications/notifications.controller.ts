import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Roles('CUSTOMER', 'PROVIDER', 'ADMIN')
  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listForUser(user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER', 'ADMIN')
  @Post(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Roles('CUSTOMER', 'PROVIDER', 'ADMIN')
  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }
}
