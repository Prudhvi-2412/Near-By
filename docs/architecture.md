# Architecture

## System overview

```
                         Users
                           │
                       CloudFront
                     (CDN + TLS edge)
                           │
                 Application Load Balancer
                    /api/*        default
                    │                │
              ┌─────▼─────┐   ┌──────▼─────┐
              │  api (ECS) │   │ web (ECS)  │   Next.js — public site,
              │  NestJS    │   │  Next.js   │   customer/provider/admin
              └─────┬──────┘   └────────────┘   dashboards (role-gated
                    │                             route groups)
     ┌──────────────┼───────────────────┬─────────────────┐
     │              │                   │                 │
┌────▼────┐   ┌─────▼─────┐      ┌──────▼──────┐   ┌──────▼──────┐
│ Postgres │   │   Redis   │      │  Kafka (MSK) │   │  S3 (media, │
│  (RDS)   │   │(ElastiCache)     │              │   │ verification)│
└──────────┘   └───────────┘      └──────┬───────┘   └─────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │                        │
                       transport-service (ECS)   consumers inside `api`:
                       vehicles/drivers/rides     notifications, analytics
                       own Kafka topics
```

## Why one repo, several deployables

Near By is a monorepo (`apps/`, `services/`, `packages/`) but **three independently
deployable units**: the Next.js web app, the main NestJS API, and the
transport-service. They're versioned together for developer convenience —
one `npm install`, one set of shared types/events — but each gets its own
Dockerfile, ECS service, and can scale on its own.

## Why the admin console is routes inside `apps/web`, not a fourth app

The spec's example layout lists a separate `apps/admin`. In practice the
admin surface is ~8 pages that need the same design system, the same
`apiClient`/auth plumbing, and the same component library as the customer
and provider dashboards. Duplicating a whole Next.js app (build config,
Tailwind theme, auth bootstrap, API client) for that would be pure
overhead with no deployment benefit — admin isn't under different load or
release cadence than the rest of the site. Instead, `/admin/*` is a
role-gated route group inside `apps/web`, sharing `packages/ui` and the
same auth/session code as every other role. If admin ever needs to be
pulled out (e.g. a different SSO story, or a separate release train), the
`(admin)` route group and its components can be lifted into a new app with
minimal churn, since it already only touches shared packages.

## Why transport-service is separate, but shares the database (for now)

The spec calls for transportation to "scale independently." It's a
standalone NestJS app with its own Dockerfile, ECS service, and Kafka
topics (`transport.*`) — the main API only ever talks to it over HTTP
(`TransportClientService`) or by producing/consuming events, never by
reaching into its tables directly.

Locally and in this reference deployment it still points at the same
Postgres instance (different tables: `vehicles`, `drivers`,
`transport_requests`) purely to keep local dev to one database container.
In a production split, `transport-service` would get its own RDS
instance/schema — nothing in its code assumes a shared database, so that
split is a connection-string change, not a rewrite.

## Auth model and why there's no `middleware.ts`

Access tokens are short-lived JWTs held in memory in the browser tab
(never `localStorage`), refreshed via an httpOnly refresh-token cookie.
This avoids XSS-exfiltrable tokens, but it means Next.js middleware
(which runs at the edge, before any client JS) can't inspect roles to
gate routes — the refresh cookie is opaque and carries no role claims by
design. Route protection is therefore done client-side: `DashboardShell`
checks `useAuth()` and redirects unauthenticated or wrong-role users. This
is a deliberate trade-off (a flash of a loading state instead of an
edge redirect) in exchange for not putting a long-lived, role-bearing
token anywhere JS-readable.

## Booking concurrency

Double-booking is prevented two ways, deliberately redundant:

1. **Redis lock** (`booking-lock:slot:<slotId>`) — a fast, short-lived
   `SET NX PX` lock that serializes concurrent attempts on the same slot
   so most contention never even reaches the database.
2. **DB-level conditional update** — inside the same Postgres transaction
   that inserts the booking, the slot row is updated with
   `WHERE id = ? AND status = 'OPEN'`. If zero rows match (another
   transaction already flipped it), the whole transaction rolls back and
   the customer gets a clear "someone else just booked this" error.

The Redis lock is an optimization; the DB conditional update is the actual
correctness guarantee. See
`services/api/test/booking-concurrency.e2e-spec.ts` for the test that
fires two simultaneous booking attempts at the same slot and asserts
exactly one wins.

## Payments — never trust the frontend

`PaymentsService` never marks a booking confirmed because the browser
said so. The only path to `CONFIRMED` is a webhook whose HMAC signature
verifies against the payload bytes (not the re-parsed JSON), deduplicated
by the gateway's event id via a unique constraint on `payment_events`.
The `MockPaymentProvider` used for local dev exercises this exact same
path — its "Simulate payment" button in the UI constructs a signed
webhook body and posts it back to the same `/payments/webhooks/mock`
endpoint a real gateway would call.

## Imagery

No stock photography is hotlinked. Provider photos come from real
uploads (S3/MinIO); everywhere else (landing page, empty states, avatar
fallbacks) uses original SVG/CSS "cinematic" gradients and line art
(`components/visuals/*`) rather than third-party images, to avoid any
licensing ambiguity. Swapping in licensed photography later is a
one-line change per component.
