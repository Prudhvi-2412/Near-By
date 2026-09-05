import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { RazorpayPaymentProvider } from './providers/razorpay-payment.provider';
import { PAYMENT_PROVIDER, MOCK_PAYMENT_PROVIDER, RAZORPAY_PAYMENT_PROVIDER } from './payment-provider.token';
import type { PaymentProvider } from './payment-provider.interface';

@Global()
@Module({
  providers: [
    MockPaymentProvider,
    RazorpayPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, MockPaymentProvider, RazorpayPaymentProvider],
      useFactory: (
        config: ConfigService,
        mock: MockPaymentProvider,
        razorpay: RazorpayPaymentProvider,
      ): PaymentProvider => (config.get<string>('PAYMENT_PROVIDER') === 'razorpay' ? razorpay : mock),
    },
    // Always available so the mock-only "simulate payment" endpoint works even
    // when Razorpay is the active provider for real orders, and so webhooks
    // can be routed to the right provider implementation by name.
    { provide: MOCK_PAYMENT_PROVIDER, useExisting: MockPaymentProvider },
    { provide: RAZORPAY_PAYMENT_PROVIDER, useExisting: RazorpayPaymentProvider },
  ],
  exports: [PAYMENT_PROVIDER, MOCK_PAYMENT_PROVIDER, RAZORPAY_PAYMENT_PROVIDER],
})
export class PaymentsProviderModule {}
