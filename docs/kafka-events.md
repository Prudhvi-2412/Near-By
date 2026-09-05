# Kafka events

Topic names and payload schemas live in [`packages/events`](../packages/events/src)
— `topics.ts` and `schemas.ts` — shared between `services/api` and
`services/transport-service` so producers and consumers can never drift
out of sync on shape.

## Envelope

Every message is a flat JSON object: the event-specific payload fields
plus three envelope fields stamped on by `KafkaProducerService.publish()`:

```json
{
  "eventId": "uuid — unique per publish, used nowhere for business logic",
  "occurredAt": "ISO 8601 timestamp",
  "source": "near-by-api | near-by-transport-service",
  "...": "event-specific fields, see packages/events/src/schemas.ts"
}
```

## Topics

| Topic | Producer | Consumer(s) | Purpose |
|---|---|---|---|
| `booking.created` | api (BookingsService) | analytics | New booking requested |
| `payment.verified` | api (PaymentsService, after webhook signature check) | analytics | Payment confirmed by the gateway |
| `booking.confirmed` | api (BookingsService, on payment verification) | *(produced for downstream/future consumers — e.g. a real-time UI channel)* | Booking moved to CONFIRMED |
| `booking.cancelled` | api (BookingsService) | *(same as above)* | Booking cancelled by either party |
| `booking.completed` | api (BookingsService) | analytics | Booking marked COMPLETED |
| `availability.updated` | api (ProvidersService) | *(same as above)* | Provider changed AVAILABLE_NOW/LATER/BUSY/UNAVAILABLE |
| `provider.price-updated` | api (ProvidersService, on price change) | *(same as above)* | A price tier's value changed |
| `notification.requested` | api (bookings, payments, reviews, verification, safety modules) | **notifications** (writes the in-app row, dispatches email/SMS via the console-backed providers) | Generic "notify this user" event |
| `rating.submitted` | api (ReviewsService) | analytics | A review was created |
| `transport.requested` | transport-service | *(reserved for a future dispatch consumer)* | A ride was requested |
| `transport.assigned` | transport-service | *(reserved)* | A vehicle/driver was assigned |
| `transport.completed` | transport-service | *(reserved)* | A trip completed |

Several topics are produced but only have a placeholder consumer today —
that's intentional and documented rather than hidden: `booking.confirmed`,
`booking.cancelled`, `availability.updated`, and `provider.price-updated`
are exactly the events a real-time UI layer (WebSocket/SSE gateway) or a
separate read-model service would subscribe to in a larger deployment.
Producing them now means adding that consumer later is additive, not a
schema change.

## Consumer groups

Defined once in `packages/events/src/topics.ts` (`CONSUMER_GROUPS`) so a
producer and its consumer can never accidentally use different group ids:

- `near-by-notifications` — `NotificationsConsumer` (`services/api/src/modules/notifications/notifications.consumer.ts`)
- `near-by-analytics` — `AnalyticsConsumer` (`services/api/src/modules/analytics/analytics.consumer.ts`) — feeds the Redis counters behind the admin dashboard's "today" widgets
- `near-by-transport` — reserved for the transport dispatch consumer described above
- `near-by-availability` — reserved (see architecture.md's note on why there's no availability consumer yet)

## Retry and dead-letter handling

`KafkaConsumerBase` (`services/api/src/common/kafka/kafka-consumer.base.ts`)
wraps every consumer:

1. On handler failure, the message is re-published to the **same topic**
   with an `x-retry-count` header incremented by one, and the original
   offset is committed (so a bad message can't block the partition).
2. After 3 retries, the message is published to `<topic>.dlq` with
   `x-error` and `x-original-topic` headers, for manual inspection/replay.
3. `NotificationsConsumer` and `AnalyticsConsumer` both extend this base
   and only implement `handle(topic, payload)` — retry/DLQ logic is never
   duplicated per consumer.

## Idempotency

Kafka delivery is at-least-once, so every consumer is written to tolerate
redelivery:

- **Notifications**: creating a `Notification` row twice for the same
  logical event is a low-severity duplicate (a repeated in-app
  notification), which is the reasonable trade-off; if the retry model
  above kept messages exactly-once we'd remove even that.
- **Analytics counters**: `INCRBY`/`INCRBYFLOAT` on redelivery over-counts
  by design of "eventually consistent dashboard widget" — the authoritative
  numbers on the admin analytics page come from Postgres aggregation
  queries (`AdminService.platformAnalytics`), not these counters.
- **Payments**, the one place duplication would be a real bug, isn't
  handled through this generic consumer path at all — it's deduplicated
  explicitly on `PaymentEvent.providerEventId` (a unique DB constraint)
  before any side effect runs. See `payment-webhook.e2e-spec.ts`.
