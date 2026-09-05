export const TOPICS = {
  BOOKING_CREATED: 'booking.created',
  PAYMENT_VERIFIED: 'payment.verified',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_COMPLETED: 'booking.completed',
  AVAILABILITY_UPDATED: 'availability.updated',
  PROVIDER_PRICE_UPDATED: 'provider.price-updated',
  NOTIFICATION_REQUESTED: 'notification.requested',
  RATING_SUBMITTED: 'rating.submitted',
  TRANSPORT_REQUESTED: 'transport.requested',
  TRANSPORT_ASSIGNED: 'transport.assigned',
  TRANSPORT_COMPLETED: 'transport.completed',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

export const ALL_TOPICS: TopicName[] = Object.values(TOPICS);

/** Every consumer group name lives here so producers/consumers can't drift out of sync. */
export const CONSUMER_GROUPS = {
  NOTIFICATIONS: 'near-by-notifications',
  AVAILABILITY: 'near-by-availability',
  ANALYTICS: 'near-by-analytics',
  TRANSPORT: 'near-by-transport',
} as const;

/** DLQ topic for a given topic — failed messages land here after retry exhaustion. */
export function toDlq(topic: TopicName | string): string {
  return `${topic}.dlq`;
}
