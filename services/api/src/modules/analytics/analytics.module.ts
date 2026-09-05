import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  providers: [AnalyticsService, AnalyticsConsumer],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
