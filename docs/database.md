# Database

Single Postgres database (see [architecture.md](./architecture.md) for why
transport-service shares it for now), managed by Prisma. Full source of
truth: [`prisma/schema.prisma`](../prisma/schema.prisma).

## Conventions

- **IDs**: UUID primary keys everywhere (`@default(uuid())`).
- **Money**: `Decimal @db.Decimal(10, 2)`, never `Float` — avoids rounding
  drift on prices/totals/refunds.
- **Timestamps**: `createdAt`/`updatedAt` on every mutable table.
- **Soft deletion**: `deletedAt DateTime?` on tables representing
  long-lived entities users might want restored or need retained for audit
  (`User`, `ProviderProfile`, `AccommodationPartner`) — bookings, payments,
  and audit logs are never deleted at all, only status-transitioned.
- **Enums** are Postgres enums via Prisma (`BookingStatus`,
  `PaymentStatus`, etc.), mirrored as TypeScript union types in
  `packages/types/src/enums.ts` for the frontend without pulling in
  `@prisma/client`.

## Table groups

| Group | Tables |
|---|---|
| Identity & access | `users`, `roles`, `user_roles`, `refresh_tokens` |
| Marketplace | `provider_profiles`, `provider_services`, `provider_pricing`, `provider_pricing_history`, `provider_availability` |
| Booking | `bookings`, `booking_items`, `booking_status_history` |
| Payments | `payments`, `payment_events` |
| Reputation | `reviews`, `review_reports` |
| Verification | `verification_requests`, `verification_documents` |
| Notifications & messaging | `notifications`, `messages` |
| Safety | `trusted_contacts`, `check_ins`, `emergency_alerts`, `blocks`, `reports`, `disputes` |
| Pricing intelligence | `pricing_rules`, `pricing_suggestions` |
| Accommodation | `accommodation_partners`, `accommodation_rooms`, `accommodation_bookings` |
| Transportation | `drivers`, `vehicles`, `transport_requests`, `provider_transport_preferences` |
| Platform | `audit_logs` |

## Notable relationships

- `Booking` 1—N `BookingItem` (line items — a booking can have more than one
  service/duration combined, though the UI currently only ever creates one)
  and 1—N `BookingStatusHistory` (full audit trail of every transition,
  including who/what triggered it — `system:cron`, `system:payment-webhook`,
  or a user id).
- `ProviderPricing` 1—N `ProviderPricingHistory` — every price *change*
  (not creation) is recorded with old/new price and who changed it, so
  "pricing history" in the provider dashboard is a real query, not derived
  state.
- `ProviderAvailabilitySlot` has a nullable, unique `bookingId` — a slot is
  either `OPEN`, or `BOOKED` and pointing at exactly one booking. This is
  the row the booking-concurrency guard operates on (see
  architecture.md).
- `Review` is unique on `(bookingId, authorId)`, not on `bookingId` alone —
  both the customer *and* the provider can leave one review each for the
  same completed booking (customer→provider and provider→customer ratings
  per the reputation system).
- `PaymentEvent.providerEventId` is globally unique — this is the actual
  idempotency mechanism for webhook processing. A duplicate delivery of the
  same gateway event is detected here before any side effect runs.

## Migrations

```bash
npm run prisma:migrate    # dev: creates and applies a new migration
npm run prisma:deploy     # CI/production: applies pending migrations only
npm run prisma:studio     # browse data locally
npm run prisma:seed       # re-run prisma/seed.ts
```

`prisma/seed.ts` creates: 3 roles, 1 admin, 3 customers, 5 providers across
5 Indian cities (with services, duration-based pricing, availability
slots, and a mix of identity/health verification states), 6 bookings
spanning the full lifecycle (completed+reviewed, confirmed, requested,
cancelled, in-progress), a pending pricing suggestion, 2 accommodation
partners with rooms, 3 drivers/vehicles with sample trips, and a couple of
notifications. Login credentials are printed at the end of the seed run.
