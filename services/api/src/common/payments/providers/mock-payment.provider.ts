import { Injectable } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import type {
  CreateOrderParams,
  CreateOrderResult,
  ParsedWebhookEvent,
  PaymentProvider,
} from '../payment-provider.interface';

const MOCK_WEBHOOK_SECRET = 'mock-webhook-secret-do-not-use-in-prod';

/**
 * Simulates a payment gateway for local development and demos. It still goes
 * through real HMAC signature verification so the booking → pay → webhook →
 * confirm pipeline is exercised exactly as it would be with Razorpay.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'MOCK' as const;

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    return {
      providerOrderId: `mock_order_${randomUUID()}`,
      amount: params.amount,
      currency: params.currency,
      clientFields: { mock: true },
    };
  }

  buildSignedWebhookBody(providerOrderId: string, status: 'SUCCEEDED' | 'FAILED') {
    const body = JSON.stringify({
      eventId: `mock_evt_${randomUUID()}`,
      eventType: status === 'SUCCEEDED' ? 'payment.captured' : 'payment.failed',
      providerOrderId,
      status,
    });
    const signature = createHmac('sha256', MOCK_WEBHOOK_SECRET).update(body).digest('hex');
    return { rawBody: Buffer.from(body), signature };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const expected = createHmac('sha256', MOCK_WEBHOOK_SECRET).update(rawBody).digest('hex');
    return expected === signatureHeader;
  }

  parseWebhookEvent(rawBody: Buffer): ParsedWebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8'));
    return {
      providerEventId: parsed.eventId,
      eventType: parsed.eventType,
      providerOrderId: parsed.providerOrderId,
      status: parsed.status,
      raw: parsed,
    };
  }

  async refund(providerOrderId: string): Promise<{ refundId: string }> {
    return { refundId: `mock_refund_${providerOrderId}` };
  }
}
