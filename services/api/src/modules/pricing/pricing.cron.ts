import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricingService } from './pricing.service';

@Injectable()
export class PricingCron {
  private readonly logger = new Logger(PricingCron.name);

  constructor(private readonly pricing: PricingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDemandScan() {
    try {
      await this.pricing.generateForAllActiveProviders();
    } catch (err) {
      this.logger.error(`Pricing demand scan failed: ${(err as Error).message}`);
    }
  }
}
