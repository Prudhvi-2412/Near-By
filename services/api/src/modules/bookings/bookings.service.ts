import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { PaymentsService } from '../payments/payments.service';
import { TOPICS } from '@near-by/events';
import { assertTransition } from './booking-state-machine';
import type { CreateBookingDto } from './dto/create-booking.dto';

function generateBookingNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NB-${stamp}-${rand}`;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly kafka: KafkaProducerService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createBooking(customerId: string, dto: CreateBookingDto) {
    const pricing = await this.prisma.providerPricing.findUnique({
      where: { id: dto.providerPricingId },
      include: { provider: true },
    });
    if (!pricing || !pricing.isActive || !pricing.provider.isActive) {
      throw new NotFoundException('Pricing tier not found');
    }

    const slot = await this.prisma.providerAvailabilitySlot.findUnique({ where: { id: dto.availabilitySlotId } });
    if (!slot || slot.providerId !== pricing.providerId) {
      throw new NotFoundException('Availability slot not found');
    }
    if (slot.startTime < new Date()) {
      throw new BadRequestException('This slot is in the past');
    }

    const scheduledEnd = new Date(slot.startTime.getTime() + pricing.durationMinutes * 60_000);
    if (scheduledEnd > slot.endTime) {
      throw new BadRequestException('This slot is too short for the selected duration');
    }

    const lockKey = `booking-lock:slot:${slot.id}`;
    try {
      return await this.redis.withLock(lockKey, () => this.commitBooking(customerId, pricing, slot.id, slot.startTime, scheduledEnd, dto.meetingNotes));
    } catch (err) {
      if ((err as Error).message?.startsWith('LOCK_CONTENDED')) {
        throw new ConflictException('This slot is being booked by someone else right now — please try another.');
      }
      throw err;
    }
  }

  private async commitBooking(
    customerId: string,
    pricing: { id: string; providerId: string; durationMinutes: number; price: unknown; currency: string; provider: { city: string } },
    slotId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    meetingNotes?: string,
  ) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          bookingNumber: generateBookingNumber(),
          customerId,
          providerId: pricing.providerId,
          status: 'REQUESTED',
          scheduledStart,
          scheduledEnd,
          durationMinutes: pricing.durationMinutes,
          city: pricing.provider.city,
          meetingNotes,
          totalAmount: pricing.price as never,
          currency: pricing.currency,
          items: {
            create: [
              {
                providerPricingId: pricing.id,
                label: `Companionship (${pricing.durationMinutes} min)`,
                durationMinutes: pricing.durationMinutes,
                unitPrice: pricing.price as never,
                quantity: 1,
                subtotal: pricing.price as never,
              },
            ],
          },
          statusHistory: { create: [{ toStatus: 'REQUESTED', changedBy: customerId }] },
        },
      });

      const linked = await tx.providerAvailabilitySlot.updateMany({
        where: { id: slotId, status: 'OPEN' },
        data: { status: 'BOOKED', bookingId: created.id },
      });
      if (linked.count !== 1) {
        throw new ConflictException('This slot was just booked by someone else — please try another.');
      }

      return created;
    });

    await this.kafka.publish(TOPICS.BOOKING_CREATED, {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      providerId: booking.providerId,
      scheduledStart: booking.scheduledStart.toISOString(),
      scheduledEnd: booking.scheduledEnd.toISOString(),
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
    });

    const provider = await this.prisma.providerProfile.findUniqueOrThrow({ where: { id: booking.providerId } });
    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: provider.userId,
      type: 'BOOKING_REQUESTED',
      title: 'New booking request',
      body: `You have a new booking request for ${booking.scheduledStart.toLocaleString()}.`,
      channel: 'IN_APP',
    });

    return booking;
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { items: true, provider: true, payments: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async requireParticipant(bookingId: string, userId: string) {
    const booking = await this.findById(bookingId);
    const provider = await this.prisma.providerProfile.findUnique({ where: { id: booking.providerId } });
    const isCustomer = booking.customerId === userId;
    const isProvider = provider?.userId === userId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You do not have access to this booking');
    }
    return { booking, isCustomer, isProvider, provider };
  }

  async getForUser(bookingId: string, userId: string) {
    const { booking } = await this.requireParticipant(bookingId, userId);
    return booking;
  }

  listForCustomer(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      include: { provider: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForProvider(userId: string) {
    const provider = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return this.prisma.booking.findMany({
      where: { providerId: provider.id },
      include: { items: true, customer: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async transition(bookingId: string, to: BookingStatus, changedBy: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
      assertTransition(booking.status, to);
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: to,
          ...(to === 'CANCELLED' || to === 'REJECTED' ? { cancellationReason: reason, cancelledBy: changedBy } : {}),
        },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId, fromStatus: booking.status, toStatus: to, changedBy, reason },
      });
      return updated;
    });
  }

  private async releaseSlot(bookingId: string) {
    await this.prisma.providerAvailabilitySlot.updateMany({
      where: { bookingId },
      data: { status: 'OPEN', bookingId: null },
    });
  }

  async accept(bookingId: string, userId: string) {
    const { booking, isProvider } = await this.requireParticipant(bookingId, userId);
    if (!isProvider) {
      throw new ForbiddenException('Only the provider can accept this booking');
    }
    const updated = await this.transition(bookingId, 'PENDING_PAYMENT', userId);
    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: booking.customerId,
      type: 'BOOKING_ACCEPTED',
      title: 'Booking accepted — payment required',
      body: 'Your booking request was accepted. Complete payment to confirm it.',
      channel: 'IN_APP',
    });
    return updated;
  }

  async reject(bookingId: string, userId: string, reason: string) {
    const { isProvider } = await this.requireParticipant(bookingId, userId);
    if (!isProvider) {
      throw new ForbiddenException('Only the provider can reject this booking');
    }
    const updated = await this.transition(bookingId, 'REJECTED', userId, reason);
    await this.releaseSlot(bookingId);
    return updated;
  }

  async cancel(bookingId: string, userId: string, reason: string) {
    const { booking, isCustomer, isProvider } = await this.requireParticipant(bookingId, userId);
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You cannot cancel this booking');
    }
    if (!['REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException(`Bookings in status ${booking.status} cannot be cancelled`);
    }

    const updated = await this.transition(bookingId, 'CANCELLED', userId, reason);
    await this.releaseSlot(bookingId);

    const successfulPayment = await this.prisma.payment.findFirst({
      where: { bookingId, status: 'SUCCEEDED' },
    });
    if (successfulPayment) {
      await this.paymentsService.refund(successfulPayment.id, `Booking cancelled: ${reason}`);
    }

    await this.kafka.publish(TOPICS.BOOKING_CANCELLED, {
      bookingId,
      cancelledBy: userId,
      reason,
    });
    return updated;
  }

  /** Called by DisputesService when a participant raises a dispute against a booking. */
  async raiseDispute(bookingId: string, userId: string) {
    const { booking } = await this.requireParticipant(bookingId, userId);
    if (!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
      throw new BadRequestException(`Bookings in status ${booking.status} cannot be disputed`);
    }
    return this.transition(bookingId, 'DISPUTED', userId);
  }

  /** Called by DisputesService once an admin resolves a dispute. */
  async resolveDisputeOutcome(bookingId: string, adminId: string, outcome: 'COMPLETED' | 'CANCELLED', reason: string) {
    const updated = await this.transition(bookingId, outcome, adminId, reason);
    if (outcome === 'CANCELLED') {
      await this.releaseSlot(bookingId);
      const successfulPayment = await this.prisma.payment.findFirst({ where: { bookingId, status: 'SUCCEEDED' } });
      if (successfulPayment) {
        await this.paymentsService.refund(successfulPayment.id, `Dispute resolved: ${reason}`);
      }
    }
    return updated;
  }

  async markInProgress(bookingId: string, userId: string) {
    const { isProvider } = await this.requireParticipant(bookingId, userId);
    if (!isProvider) {
      throw new ForbiddenException('Only the provider can start this booking');
    }
    return this.transition(bookingId, 'IN_PROGRESS', userId);
  }

  async markCompleted(bookingId: string, userId: string) {
    const { isProvider, booking } = await this.requireParticipant(bookingId, userId);
    if (!isProvider) {
      throw new ForbiddenException('Only the provider can complete this booking');
    }
    const updated = await this.completeBooking(booking.id, userId);
    return updated;
  }

  private async completeBooking(bookingId: string, changedBy: string) {
    const updated = await this.transition(bookingId, 'COMPLETED', changedBy);
    await this.prisma.providerProfile.update({
      where: { id: updated.providerId },
      data: { completedBookingsCount: { increment: 1 } },
    });
    await this.kafka.publish(TOPICS.BOOKING_COMPLETED, {
      bookingId: updated.id,
      providerId: updated.providerId,
      customerId: updated.customerId,
      completedAt: new Date().toISOString(),
    });
    return updated;
  }

  // ---- Called by PaymentsService once a webhook verifies payment success ----
  async onPaymentVerified(bookingId: string) {
    await this.transition(bookingId, 'PAYMENT_VERIFIED', 'system:payment-webhook');
    const confirmed = await this.transition(bookingId, 'CONFIRMED', 'system:payment-webhook');
    await this.kafka.publish(TOPICS.BOOKING_CONFIRMED, {
      bookingId: confirmed.id,
      providerId: confirmed.providerId,
      customerId: confirmed.customerId,
      scheduledStart: confirmed.scheduledStart.toISOString(),
    });
    const provider = await this.prisma.providerProfile.findUniqueOrThrow({ where: { id: confirmed.providerId } });
    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: provider.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking confirmed',
      body: 'Payment was received and the booking is now confirmed.',
      channel: 'IN_APP',
    });
    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: confirmed.customerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking confirmed',
      body: 'Your payment was verified and the booking is confirmed.',
      channel: 'IN_APP',
    });
    return confirmed;
  }

  // ---- Scheduled housekeeping (see bookings.cron.ts) ----
  async expireStaleBookings() {
    const requestDeadline = new Date(Date.now() - 30 * 60_000);
    const paymentDeadline = new Date(Date.now() - 15 * 60_000);

    const stale = await this.prisma.booking.findMany({
      where: {
        OR: [
          { status: 'REQUESTED', createdAt: { lt: requestDeadline } },
          { status: 'PENDING_PAYMENT', updatedAt: { lt: paymentDeadline } },
        ],
      },
    });

    for (const booking of stale) {
      await this.transition(booking.id, 'EXPIRED', 'system:cron');
      await this.releaseSlot(booking.id);
      this.logger.log(`Expired stale booking ${booking.bookingNumber}`);
    }
    return stale.length;
  }

  async autoStartConfirmedBookings() {
    const due = await this.prisma.booking.findMany({
      where: { status: 'CONFIRMED', scheduledStart: { lte: new Date() } },
    });
    for (const booking of due) {
      await this.transition(booking.id, 'IN_PROGRESS', 'system:cron');
    }
    return due.length;
  }

  async autoCompleteInProgressBookings() {
    const due = await this.prisma.booking.findMany({
      where: { status: 'IN_PROGRESS', scheduledEnd: { lte: new Date() } },
    });
    for (const booking of due) {
      await this.completeBooking(booking.id, 'system:cron');
    }
    return due.length;
  }
}
