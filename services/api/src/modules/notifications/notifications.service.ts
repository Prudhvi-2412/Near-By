import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailProvider } from './channels/email.provider';
import { SmsProvider } from './channels/sms.provider';
import type { NotificationRequestedPayload } from '@near-by/events';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
  ) {}

  async deliver(payload: NotificationRequestedPayload) {
    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data as never,
        channel: payload.channel,
      },
    });

    if (payload.channel === 'EMAIL') {
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (user) await this.email.send(user.email, payload.title, payload.body);
    } else if (payload.channel === 'SMS') {
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (user?.phone) await this.sms.send(user.phone, payload.body);
    }
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }
}
