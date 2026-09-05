import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReasonDto } from './dto/reason.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Roles('CUSTOMER')
  @Post()
  @AuditLog({ action: 'BOOKING_CREATED', entityType: 'Booking' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return this.bookings.createBooking(user.id, dto);
  }

  @Roles('CUSTOMER')
  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.bookings.listForCustomer(user.id);
  }

  @Roles('PROVIDER')
  @Get('provider')
  forProvider(@CurrentUser() user: AuthenticatedUser) {
    return this.bookings.listForProvider(user.id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookings.getForUser(id, user.id);
  }

  @Roles('PROVIDER')
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookings.accept(id, user.id);
  }

  @Roles('PROVIDER')
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReasonDto) {
    return this.bookings.reject(id, user.id, dto.reason);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post(':id/cancel')
  @AuditLog({ action: 'BOOKING_CANCELLED', entityType: 'Booking' })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ReasonDto) {
    return this.bookings.cancel(id, user.id, dto.reason);
  }

  @Roles('PROVIDER')
  @Post(':id/start')
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookings.markInProgress(id, user.id);
  }

  @Roles('PROVIDER')
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bookings.markCompleted(id, user.id);
  }
}
