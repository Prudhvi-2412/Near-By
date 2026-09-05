import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccommodationService } from './accommodation.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateAccommodationBookingDto } from './dto/create-accommodation-booking.dto';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { IsIn } from 'class-validator';

class UpdateAccommodationStatusDto {
  @IsIn(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status!: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

@ApiTags('accommodation')
@Controller('accommodation')
export class AccommodationController {
  constructor(private readonly accommodation: AccommodationService) {}

  @Public()
  @Get('partners')
  listPartners(@Query('city') city?: string) {
    return this.accommodation.listPartners(city);
  }

  @Public()
  @Get('partners/:id')
  listRooms(@Param('id') id: string) {
    return this.accommodation.listRooms(id);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Post('bookings')
  requestBooking(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccommodationBookingDto) {
    return this.accommodation.requestBooking(user.id, dto);
  }

  @Roles('CUSTOMER', 'PROVIDER')
  @Get('bookings/mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.accommodation.myBookings(user.id);
  }

  @Roles('ADMIN')
  @Post('admin/partners')
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.accommodation.createPartner(dto);
  }

  @Roles('ADMIN')
  @Post('admin/partners/:id/rooms')
  createRoom(@Param('id') id: string, @Body() dto: CreateRoomDto) {
    return this.accommodation.createRoom(id, dto);
  }

  @Roles('ADMIN')
  @Get('admin/bookings')
  adminListBookings() {
    return this.accommodation.adminListBookings();
  }

  @Roles('ADMIN')
  @Post('admin/bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAccommodationStatusDto) {
    return this.accommodation.updateBookingStatus(id, dto.status);
  }
}
