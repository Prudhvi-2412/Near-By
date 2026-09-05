import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransportClientService } from './transport-client.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequestRideDto } from './dto/request-ride.dto';

@ApiTags('transport')
@Controller('transport')
export class TransportClientController {
  constructor(private readonly transport: TransportClientService) {}

  @Roles('PROVIDER')
  @Post('requests')
  request(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestRideDto) {
    return this.transport.requestRide(user.id, dto.pickupLocation, dto.dropoffLocation);
  }

  @Roles('PROVIDER')
  @Get('requests/mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.transport.listMine(user.id);
  }

  @Roles('PROVIDER')
  @Get('requests/:id')
  getOne(@Param('id') id: string) {
    return this.transport.getOne(id);
  }

  @Roles('PROVIDER')
  @Post('requests/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.transport.cancel(id);
  }
}
