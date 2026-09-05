import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CreateAccommodationBookingDto } from './dto/create-accommodation-booking.dto';
import type { CreatePartnerDto } from './dto/create-partner.dto';
import type { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class AccommodationService {
  constructor(private readonly prisma: PrismaService) {}

  listPartners(city?: string) {
    return this.prisma.accommodationPartner.findMany({
      where: { isActive: true, deletedAt: null, ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}) },
      include: { rooms: { where: { isActive: true } } },
    });
  }

  async listRooms(partnerId: string) {
    const partner = await this.prisma.accommodationPartner.findUnique({
      where: { id: partnerId },
      include: { rooms: { where: { isActive: true } } },
    });
    if (!partner) {
      throw new NotFoundException('Accommodation partner not found');
    }
    return partner;
  }

  async requestBooking(userId: string, dto: CreateAccommodationBookingDto) {
    const room = await this.prisma.accommodationRoom.findUnique({ where: { id: dto.roomId } });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60_000));
    if (nights <= 0) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    return this.prisma.accommodationBooking.create({
      data: {
        roomId: room.id,
        requestedById: userId,
        checkIn,
        checkOut,
        totalAmount: Number(room.pricePerNight) * nights,
      },
    });
  }

  myBookings(userId: string) {
    return this.prisma.accommodationBooking.findMany({
      where: { requestedById: userId },
      include: { room: { include: { partner: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Admin ----

  createPartner(dto: CreatePartnerDto) {
    return this.prisma.accommodationPartner.create({ data: dto });
  }

  async createRoom(partnerId: string, dto: CreateRoomDto) {
    const partner = await this.prisma.accommodationPartner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      throw new NotFoundException('Accommodation partner not found');
    }
    return this.prisma.accommodationRoom.create({ data: { ...dto, partnerId } });
  }

  adminListBookings() {
    return this.prisma.accommodationBooking.findMany({
      include: { room: { include: { partner: true } }, requestedBy: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
    const booking = await this.prisma.accommodationBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Accommodation booking not found');
    }
    return this.prisma.accommodationBooking.update({ where: { id }, data: { status } });
  }
}
