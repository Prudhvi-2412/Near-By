import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(private readonly bookings: BookingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiry() {
    const count = await this.bookings.expireStaleBookings();
    if (count > 0) this.logger.log(`Expired ${count} stale booking(s)`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoStart() {
    const count = await this.bookings.autoStartConfirmedBookings();
    if (count > 0) this.logger.log(`Auto-started ${count} booking(s)`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoComplete() {
    const count = await this.bookings.autoCompleteInProgressBookings();
    if (count > 0) this.logger.log(`Auto-completed ${count} booking(s)`);
  }
}
