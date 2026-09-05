import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingCron } from './pricing.cron';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [PricingController],
  providers: [PricingService, PricingCron],
})
export class PricingModule {}
