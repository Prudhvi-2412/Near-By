export interface CreateOrderParams {
  bookingId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface CreateOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  /** Provider-specific fields the frontend checkout widget needs (e.g. Razorpay key id, mock flag). */
  clientFields: Record<string, unknown>;
}

export interface ParsedWebhookEvent {
  providerEventId: string;
  eventType: string;
  providerOrderId: string;
  status: 'SUCCEEDED' | 'FAILED';
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: 'MOCK' | 'RAZORPAY';
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean;
  parseWebhookEvent(rawBody: Buffer): ParsedWebhookEvent;
  refund(providerOrderId: string, amount: number): Promise<{ refundId: string }>;
}
