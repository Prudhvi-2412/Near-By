import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import {
  MOCK_PAYMENT_PROVIDER,
  PAYMENT_PROVIDER,
  RAZORPAY_PAYMENT_PROVIDER,
} from '../../common/payments/payment-provider.token';
import type { PaymentProvider } from '../../common/payments/payment-provider.interface';
import type { MockPaymentProvider } from '../../common/payments/providers/mock-payment.provider';
import { TOPICS } from '@near-by/events';
import { BookingsService } from '../bookings/bookings.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providersByName: Record<string, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
    @Inject(PAYMENT_PROVIDER) private readonly activeProvider: PaymentProvider,
    @Inject(MOCK_PAYMENT_PROVIDER) private readonly mockProvider: MockPaymentProvider,
    @Inject(RAZORPAY_PAYMENT_PROVIDER) razorpayProvider: PaymentProvider,
    @Inject(forwardRef(() => BookingsService)) private readonly bookingsService: BookingsService,
  ) {
    this.providersByName = { MOCK: this.mockProvider, RAZORPAY: razorpayProvider };
  }

  async initiate(bookingId: string, customerId: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (booking.customerId !== customerId) {
      throw new ForbiddenException('This booking does not belong to you');
    }
    if (booking.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Booking must be accepted by the provider before payment (current status: ${booking.status})`);
    }

    const existing = await this.prisma.payment.findFirst({
      where: { bookingId, status: { in: ['CREATED', 'PENDING', 'SUCCEEDED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return {
        paymentId: existing.id,
        providerOrderId: existing.providerOrderId,
        amount: Number(existing.amount),
        currency: existing.currency,
        provider: existing.provider,
        clientFields: existing.provider === 'MOCK' ? { mock: true } : {},
      };
    }

    const idempotencyKey = `pay_${bookingId}_${randomUUID()}`;
    const order = await this.activeProvider.createOrder({
      bookingId,
      amount: Number(booking.totalAmount),
      currency: booking.currency,
      idempotencyKey,
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        provider: this.activeProvider.name,
        providerOrderId: order.providerOrderId,
        amount: order.amount,
        currency: order.currency,
        status: 'CREATED',
        idempotencyKey,
      },
    });

    return {
      paymentId: payment.id,
      providerOrderId: order.providerOrderId,
      amount: order.amount,
      currency: order.currency,
      provider: this.activeProvider.name,
      clientFields: order.clientFields,
    };
  }

  /** Dev/demo only — simulates the payment gateway calling our webhook back. */
  async simulateMockPayment(paymentId: string, customerId: string, outcome: 'SUCCEEDED' | 'FAILED') {
    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (payment.booking.customerId !== customerId) {
      throw new ForbiddenException('This payment does not belong to you');
    }
    if (payment.provider !== 'MOCK') {
      throw new BadRequestException('Only mock payments can be simulated');
    }

    const { rawBody, signature } = this.mockProvider.buildSignedWebhookBody(payment.providerOrderId, outcome);
    return this.processWebhook('MOCK', rawBody, signature);
  }

  /** Source of truth for payment status — never trust a frontend "success" redirect alone. */
  async processWebhook(providerName: 'MOCK' | 'RAZORPAY', rawBody: Buffer, signatureHeader: string | undefined) {
    const provider = this.providersByName[providerName];
    if (!provider) {
      throw new BadRequestException(`Unknown payment provider: ${providerName}`);
    }

    const signatureValid = provider.verifyWebhookSignature(rawBody, signatureHeader);
    const parsed = provider.parseWebhookEvent(rawBody);

    const alreadyProcessed = await this.prisma.paymentEvent.findUnique({
      where: { providerEventId: parsed.providerEventId },
    });
    if (alreadyProcessed) {
      this.logger.log(`Ignoring duplicate webhook event ${parsed.providerEventId}`);
      return { received: true, duplicate: true };
    }

    const payment = await this.prisma.payment.findFirst({ where: { providerOrderId: parsed.providerOrderId } });
    if (!payment) {
      this.logger.warn(`Webhook for unknown order ${parsed.providerOrderId}`);
      return { received: true, matched: false };
    }

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        provider: providerName,
        providerEventId: parsed.providerEventId,
        eventType: parsed.eventType,
        rawPayload: parsed.raw as never,
        signatureValid,
        processedAt: signatureValid ? new Date() : null,
      },
    });

    if (!signatureValid) {
      this.logger.error(`Invalid webhook signature for order ${parsed.providerOrderId} — ignoring`);
      return { received: true, signatureValid: false };
    }

    if (parsed.status === 'SUCCEEDED' && payment.status !== 'SUCCEEDED') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } });
      await this.kafka.publish(TOPICS.PAYMENT_VERIFIED, {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        amount: Number(payment.amount),
        currency: payment.currency,
        provider: providerName,
      });
      await this.bookingsService.onPaymentVerified(payment.bookingId);
    } else if (parsed.status === 'FAILED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: parsed.eventType },
      });
    }

    return { received: true, signatureValid: true };
  }

  async refund(paymentId: string, reason: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status !== 'SUCCEEDED') {
      throw new ConflictException('Only successful payments can be refunded');
    }

    let refundTargetId = payment.providerOrderId;
    if (payment.provider === 'RAZORPAY') {
      const successEvent = await this.prisma.paymentEvent.findFirst({
        where: { paymentId, eventType: { contains: 'captured' } },
        orderBy: { createdAt: 'desc' },
      });
      const razorpayPaymentId = (successEvent?.rawPayload as { payload?: { payment?: { entity?: { id?: string } } } })
        ?.payload?.payment?.entity?.id;
      refundTargetId = razorpayPaymentId ?? refundTargetId;
    }

    const provider = this.providersByName[payment.provider];
    await provider.refund(refundTargetId, Number(payment.amount));
    await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
    this.logger.log(`Refunded payment ${paymentId}: ${reason}`);
  }
}
