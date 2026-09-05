import { z } from 'zod';

export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  source: z.string(),
});

export const bookingCreatedPayload = z.object({
  bookingId: z.string().uuid(),
  bookingNumber: z.string(),
  customerId: z.string().uuid(),
  providerId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  totalAmount: z.number(),
  currency: z.string(),
});
export type BookingCreatedPayload = z.infer<typeof bookingCreatedPayload>;

export const paymentVerifiedPayload = z.object({
  paymentId: z.string().uuid(),
  bookingId: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  provider: z.enum(['MOCK', 'RAZORPAY']),
});
export type PaymentVerifiedPayload = z.infer<typeof paymentVerifiedPayload>;

export const bookingConfirmedPayload = z.object({
  bookingId: z.string().uuid(),
  providerId: z.string().uuid(),
  customerId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
});
export type BookingConfirmedPayload = z.infer<typeof bookingConfirmedPayload>;

export const bookingCancelledPayload = z.object({
  bookingId: z.string().uuid(),
  cancelledBy: z.string().uuid(),
  reason: z.string(),
});
export type BookingCancelledPayload = z.infer<typeof bookingCancelledPayload>;

export const bookingCompletedPayload = z.object({
  bookingId: z.string().uuid(),
  providerId: z.string().uuid(),
  customerId: z.string().uuid(),
  completedAt: z.string().datetime(),
});
export type BookingCompletedPayload = z.infer<typeof bookingCompletedPayload>;

export const availabilityUpdatedPayload = z.object({
  providerId: z.string().uuid(),
  availabilityStatus: z.enum(['AVAILABLE_NOW', 'AVAILABLE_LATER', 'BUSY', 'UNAVAILABLE']),
  updatedAt: z.string().datetime(),
});
export type AvailabilityUpdatedPayload = z.infer<typeof availabilityUpdatedPayload>;

export const providerPriceUpdatedPayload = z.object({
  providerId: z.string().uuid(),
  providerPricingId: z.string().uuid(),
  oldPrice: z.number(),
  newPrice: z.number(),
});
export type ProviderPriceUpdatedPayload = z.infer<typeof providerPriceUpdatedPayload>;

export const notificationRequestedPayload = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS']),
  data: z.record(z.unknown()).optional(),
});
export type NotificationRequestedPayload = z.infer<typeof notificationRequestedPayload>;

export const ratingSubmittedPayload = z.object({
  reviewId: z.string().uuid(),
  bookingId: z.string().uuid(),
  targetId: z.string().uuid(),
  targetType: z.enum(['PROVIDER', 'CUSTOMER']),
  rating: z.number().int().min(1).max(5),
});
export type RatingSubmittedPayload = z.infer<typeof ratingSubmittedPayload>;

export const transportRequestedPayload = z.object({
  transportRequestId: z.string().uuid(),
  requesterId: z.string().uuid(),
  pickupLocation: z.string(),
  dropoffLocation: z.string(),
});
export type TransportRequestedPayload = z.infer<typeof transportRequestedPayload>;

export const transportAssignedPayload = z.object({
  transportRequestId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
});
export type TransportAssignedPayload = z.infer<typeof transportAssignedPayload>;

export const transportCompletedPayload = z.object({
  transportRequestId: z.string().uuid(),
  fare: z.number().optional(),
  completedAt: z.string().datetime(),
});
export type TransportCompletedPayload = z.infer<typeof transportCompletedPayload>;
