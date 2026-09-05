import { Injectable, Logger } from '@nestjs/common';

/**
 * Console-backed email abstraction for local development. Swap the body of
 * `send` for SES/SendGrid/etc. in production — nothing else in the codebase
 * needs to change since callers only depend on this interface.
 */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger('EmailProvider');

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[email → ${to}] ${subject}: ${body}`);
  }
}
