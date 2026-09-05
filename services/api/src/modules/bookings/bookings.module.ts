import { Module, forwardRef } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsCron } from './bookings.cron';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCron],
  exports: [BookingsService],
})
export class BookingsModule {}
