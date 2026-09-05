import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Roles('CUSTOMER', 'PROVIDER')
  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMessageDto) {
    return this.messages.send(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('booking/:bookingId')
  listForBooking(@CurrentUser() user: AuthenticatedUser, @Param('bookingId') bookingId: string) {
    return this.messages.listForBooking(bookingId, user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messages.markRead(user.id, id);
  }
}
