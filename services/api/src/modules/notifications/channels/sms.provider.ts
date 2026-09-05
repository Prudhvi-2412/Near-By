import { Injectable, Logger } from '@nestjs/common';

/** Console-backed SMS abstraction — swap for Twilio/SNS in production. */
@Injectable()
export class SmsProvider {
  private readonly logger = new Logger('SmsProvider');

  async send(to: string, body: string): Promise<void> {
    this.logger.log(`[sms → ${to}] ${body}`);
  }
}
