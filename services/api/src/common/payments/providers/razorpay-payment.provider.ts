import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';
import type {
  CreateOrderParams,
  CreateOrderResult,
  ParsedWebhookEvent,
  PaymentProvider,
} from '../payment-provider.interface';

/**
 * Real Razorpay integration — HMAC-SHA256 webhook verification and the actual
 * Orders/Payments API shapes. Only reachable when RAZORPAY_KEY_ID/SECRET are
 * configured; no live account exists in this environment so this path is
 * built and documented but not exercised end-to-end. See docs/api.md.
 */
@Injectable()
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'RAZORPAY' as const;
  private readonly logger = new Logger(RazorpayPaymentProvider.name);
  private readonly client: Razorpay;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Razorpay({
      key_id: this.config.get<string>('RAZORPAY_KEY_ID')!,
      key_secret: this.config.get<string>('RAZORPAY_KEY_SECRET')!,
    });
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET')!;
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const order = await this.client.orders.create({
      amount: Math.round(params.amount * 100), // Razorpay expects paise
      currency: params.currency,
      receipt: params.bookingId,
      notes: { bookingId: params.bookingId },
    });
    return {
      providerOrderId: order.id,
      amount: params.amount,
      currency: params.currency,
      clientFields: { keyId: this.config.get<string>('RAZORPAY_KEY_ID'), orderId: order.id },
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return expected === signatureHeader;
  }

  parseWebhookEvent(rawBody: Buffer): ParsedWebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8'));
    const entity = parsed?.payload?.payment?.entity;
    const razorpayStatus: string = entity?.status;
    const status: 'SUCCEEDED' | 'FAILED' = razorpayStatus === 'captured' ? 'SUCCEEDED' : 'FAILED';
    return {
      providerEventId: `${parsed.event}_${entity?.id}`,
      eventType: parsed.event,
      providerOrderId: entity?.order_id,
      status,
      raw: parsed,
    };
  }

  async refund(providerPaymentId: string, amount: number): Promise<{ refundId: string }> {
    const refund = await this.client.payments.refund(providerPaymentId, { amount: Math.round(amount * 100) });
    this.logger.log(`Issued Razorpay refund ${refund.id} for payment ${providerPaymentId}`);
    return { refundId: refund.id };
  }
}
