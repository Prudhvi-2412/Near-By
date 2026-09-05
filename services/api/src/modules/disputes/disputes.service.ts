import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import type { CreateDisputeDto } from './dto/create-dispute.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
  ) {}

  async create(userId: string, dto: CreateDisputeDto) {
    await this.bookings.raiseDispute(dto.bookingId, userId);
    return this.prisma.dispute.create({
      data: { bookingId: dto.bookingId, raisedById: userId, reason: dto.reason, details: dto.details },
    });
  }

  listMine(userId: string) {
    return this.prisma.dispute.findMany({ where: { raisedById: userId }, orderBy: { createdAt: 'desc' } });
  }

  adminList(status?: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED') {
    return this.prisma.dispute.findMany({
      where: status ? { status } : undefined,
      include: { booking: true, raisedBy: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolve(id: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('This dispute has already been resolved');
    }

    await this.bookings.resolveDisputeOutcome(dispute.bookingId, adminId, dto.bookingOutcome, dto.resolution ?? dto.status);

    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });
  }
}
