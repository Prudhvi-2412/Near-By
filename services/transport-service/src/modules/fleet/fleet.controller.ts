import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { InternalKeyGuard } from '../../common/guards/internal-key.guard';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { RegisterVehicleDto } from './dto/register-vehicle.dto';

@ApiTags('fleet')
@Controller()
export class FleetController {
  constructor(private readonly fleet: FleetService) {}

  @UseGuards(InternalKeyGuard)
  @Post('drivers')
  registerDriver(@Body() dto: RegisterDriverDto) {
    return this.fleet.registerDriver(dto);
  }

  @Get('drivers')
  listDrivers() {
    return this.fleet.listDrivers();
  }

  @UseGuards(InternalKeyGuard)
  @Post('vehicles')
  registerVehicle(@Body() dto: RegisterVehicleDto) {
    return this.fleet.registerVehicle(dto);
  }

  @Get('vehicles')
  listVehicles() {
    return this.fleet.listVehicles();
  }
}
