import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  const provider = new MockPaymentProvider();

  it('creates an order with a unique provider order id', async () => {
    const order = await provider.createOrder({
      bookingId: 'booking-1',
      amount: 1000,
      currency: 'INR',
      idempotencyKey: 'idem-1',
    });
    expect(order.providerOrderId).toMatch(/^mock_order_/);
    expect(order.amount).toBe(1000);
  });

  it('produces a webhook body whose signature verifies successfully', () => {
    const { rawBody, signature } = provider.buildSignedWebhookBody('mock_order_abc', 'SUCCEEDED');
    expect(provider.verifyWebhookSignature(rawBody, signature)).toBe(true);
  });

  it('rejects a tampered payload even if the original signature is reused', () => {
    const { rawBody, signature } = provider.buildSignedWebhookBody('mock_order_abc', 'SUCCEEDED');
    const tampered = Buffer.from(rawBody.toString('utf8').replace('SUCCEEDED', 'FAILED'));
    expect(provider.verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    const { rawBody } = provider.buildSignedWebhookBody('mock_order_abc', 'SUCCEEDED');
    expect(provider.verifyWebhookSignature(rawBody, undefined)).toBe(false);
  });

  it('parses the webhook event back into a structured result', () => {
    const { rawBody } = provider.buildSignedWebhookBody('mock_order_xyz', 'FAILED');
    const parsed = provider.parseWebhookEvent(rawBody);
    expect(parsed.providerOrderId).toBe('mock_order_xyz');
    expect(parsed.status).toBe('FAILED');
    expect(parsed.providerEventId).toMatch(/^mock_evt_/);
  });
});
