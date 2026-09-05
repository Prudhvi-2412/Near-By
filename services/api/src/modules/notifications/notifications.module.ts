import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsConsumer } from './notifications.consumer';
import { EmailProvider } from './channels/email.provider';
import { SmsProvider } from './channels/sms.provider';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsConsumer, EmailProvider, SmsProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
