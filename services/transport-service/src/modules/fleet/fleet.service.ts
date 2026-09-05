import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { RegisterDriverDto } from './dto/register-driver.dto';
import type { RegisterVehicleDto } from './dto/register-vehicle.dto';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDriver(dto: RegisterDriverDto) {
    try {
      return await this.prisma.driver.create({ data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A driver with this phone or license number already exists');
      }
      throw err;
    }
  }

  listDrivers() {
    return this.prisma.driver.findMany({ include: { vehicles: true }, orderBy: { createdAt: 'desc' } });
  }

  async registerVehicle(dto: RegisterVehicleDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    try {
      return await this.prisma.vehicle.create({ data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A vehicle with this plate number already exists');
      }
      throw err;
    }
  }

  listVehicles() {
    return this.prisma.vehicle.findMany({ include: { driver: true }, orderBy: { createdAt: 'desc' } });
  }

  /** First active vehicle+driver not currently on an in-progress trip. */
  async findAvailableVehicle() {
    return this.prisma.vehicle.findFirst({
      where: {
        isActive: true,
        driver: { isActive: true },
        requests: { none: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } },
      },
      include: { driver: true },
    });
  }
}
