import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TOPICS } from '@near-by/events';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { FleetService } from '../fleet/fleet.service';
import type { CreateTransportRequestDto } from './dto/create-request.dto';

const TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class TransportRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
    private readonly fleet: FleetService,
  ) {}

  async create(dto: CreateTransportRequestDto) {
    const request = await this.prisma.transportRequest.create({ data: dto });
    await this.kafka.publish(TOPICS.TRANSPORT_REQUESTED, {
      transportRequestId: request.id,
      requesterId: request.requesterId,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
    });
    return request;
  }

  private async transition(id: string, to: string) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Transport request not found');
    }
    if (!TRANSITIONS[request.status]?.includes(to)) {
      throw new BadRequestException(`Cannot move a transport request from ${request.status} to ${to}`);
    }
    return request;
  }

  async autoAssign(id: string) {
    await this.transition(id, 'ASSIGNED');
    const vehicle = await this.fleet.findAvailableVehicle();
    if (!vehicle) {
      throw new BadRequestException('No vehicles are currently available');
    }
    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: { status: 'ASSIGNED', vehicleId: vehicle.id, driverId: vehicle.driverId },
    });
    await this.kafka.publish(TOPICS.TRANSPORT_ASSIGNED, {
      transportRequestId: id,
      vehicleId: vehicle.id,
      driverId: vehicle.driverId,
    });
    return updated;
  }

  async start(id: string) {
    await this.transition(id, 'IN_PROGRESS');
    return this.prisma.transportRequest.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async complete(id: string, fare?: number) {
    await this.transition(id, 'COMPLETED');
    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date(), fare },
    });
    await this.kafka.publish(TOPICS.TRANSPORT_COMPLETED, {
      transportRequestId: id,
      fare: fare,
      completedAt: updated.completedAt!.toISOString(),
    });
    return updated;
  }

  async cancel(id: string) {
    await this.transition(id, 'CANCELLED');
    return this.prisma.transportRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  findById(id: string) {
    return this.prisma.transportRequest.findUniqueOrThrow({ where: { id } }).catch(() => {
      throw new NotFoundException('Transport request not found');
    });
  }

  listForRequester(requesterId: string) {
    return this.prisma.transportRequest.findMany({
      where: { requesterId },
      include: { vehicle: true, driver: true },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
