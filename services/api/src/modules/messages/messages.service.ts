import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { TOPICS } from '@near-by/events';
import type { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
  ) {}

  private async requireParticipant(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { provider: true } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.provider.userId === userId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
    const recipientId = isCustomer ? booking.provider.userId : booking.customerId;
    return { booking, recipientId };
  }

  async send(senderId: string, dto: CreateMessageDto) {
    const { recipientId } = await this.requireParticipant(dto.bookingId, senderId);
    const message = await this.prisma.message.create({
      data: { bookingId: dto.bookingId, senderId, recipientId, body: dto.body },
    });

    await this.kafka.publish(TOPICS.NOTIFICATION_REQUESTED, {
      userId: recipientId,
      type: 'MESSAGE',
      title: 'New message',
      body: dto.body.slice(0, 140),
      channel: 'IN_APP',
    });

    return message;
  }

  async listForBooking(bookingId: string, userId: string) {
    await this.requireParticipant(bookingId, userId);
    return this.prisma.message.findMany({ where: { bookingId }, orderBy: { createdAt: 'asc' } });
  }

  async markRead(userId: string, id: string) {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message || message.recipientId !== userId) {
      throw new NotFoundException('Message not found');
    }
    return this.prisma.message.update({ where: { id }, data: { readAt: new Date() } });
  }
}
