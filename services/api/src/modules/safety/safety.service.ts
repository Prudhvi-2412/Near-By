import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { TOPICS } from '@near-by/events';
import type { CreateTrustedContactDto } from './dto/trusted-contact.dto';
import type { ReportUserDto } from './dto/report-user.dto';
import type { EmergencyAlertDto } from './dto/emergency-alert.dto';
import type { CheckInDto } from './dto/checkin.dto';

@Injectable()
export class SafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
  ) {}

  // ---- Trusted contacts ----

  addTrustedContact(userId: string, dto: CreateTrustedContactDto) {
    return this.prisma.trustedContact.create({ data: { userId, ...dto } });
  }

  listTrustedContacts(userId: string) {
    return this.prisma.trustedContact.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async deleteTrustedContact(userId: string, id: string) {
    const contact = await this.prisma.trustedContact.findUnique({ where: { id } });
    if (!contact || contact.userId !== userId) {
      throw new NotFoundException('Trusted contact not found');
    }
    await this.prisma.trustedContact.delete({ where: { id } });
  }

  // ---- Block / report ----

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    return this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  listBlocked(blockerId: string) {
    return this.prisma.block.findMany({ where: { blockerId }, include: { blocked: { select: { id: true, email: true } } } });
  }

  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: userAId, blockedId: userBId }, { blockerId: userBId, blockedId: userAId }] },
    });
    return !!block;
  }

  reportUser(reporterId: string, dto: ReportUserDto) {
    return this.prisma.report.create({ data: { reporterId, ...dto } });
  }

  // ---- Emergency & check-in ----

  async createEmergencyAlert(userId: string, dto: EmergencyAlertDto) {
    const alert = await this.prisma.emergencyAlert.create({ data: { userId, ...dto } });

    const admins = await this.prisma.user.findMany({ where: { roles: { some: { role: { name: 'ADMIN' } } } } });
    for (const admin of admins) {
      await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
        userId: admin.id,
        type: 'EMERGENCY_ALERT',
        title: 'Emergency alert raised',
        body: dto.message || 'A user has raised an emergency alert — review immediately.',
        channel: 'IN_APP',
      });
    }
    return alert;
  }

  async resolveEmergencyAlert(id: string) {
    return this.prisma.emergencyAlert.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
  }

  listMyAlerts(userId: string) {
    return this.prisma.emergencyAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async checkIn(userId: string, dto: CheckInDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId }, include: { provider: true } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const isParticipant = booking.customerId === userId || booking.provider.userId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('You are not part of this booking');
    }
    return this.prisma.checkIn.create({ data: { bookingId: dto.bookingId, userId, type: dto.type, note: dto.note } });
  }

  listCheckIns(bookingId: string) {
    return this.prisma.checkIn.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } });
  }

  // ---- Admin ----

  adminListReports(status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: { reporter: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveReport(id: string, adminId: string, status: 'RESOLVED' | 'DISMISSED') {
    return this.prisma.report.update({ where: { id }, data: { status, resolvedBy: adminId, resolvedAt: new Date() } });
  }

  adminListAlerts(status?: 'OPEN' | 'RESOLVED') {
    return this.prisma.emergencyAlert.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
