# API

Full interactive reference: run the API and visit `/docs` (Swagger UI,
generated from the same decorators as the code — see `main.ts`). This
document covers the shape of the API and the flows that don't show up
cleanly in a generated spec: auth, payments, and RBAC.

Base URL: `http://localhost:4000/api/v1` locally (the `/health` endpoint
is the one exception, served at the root without the `/api/v1` prefix, for
load balancer / container health checks).

## Auth

JWT access tokens (15 min) + rotating refresh tokens (7 days, httpOnly
cookie scoped to `/auth`, hashed with SHA-256 before storage so a DB leak
doesn't hand out usable tokens).

```
POST /auth/register   { email, phone?, password, role: CUSTOMER|PROVIDER, ageConfirmed, termsAccepted }
POST /auth/login      { email, password }
POST /auth/refresh    (reads the httpOnly cookie, or accepts { refreshToken } in the body)
POST /auth/logout
GET  /auth/me
```

Every refresh **rotates**: the old refresh token is revoked in the same
request that issues the new one. Presenting an already-revoked token is
treated as a reuse/theft signal and rejected — see
`AuthService.refresh` and its test in `auth.service.spec.ts`.

## Authorization

Two global guards run on every route (`JwtAuthGuard`, then `RolesGuard`),
opted out of per-route:

- `@Public()` — skips authentication entirely (register/login,
  explore/provider-profile reads, health checks, payment webhooks).
- `@Roles('PROVIDER')` / `@Roles('ADMIN')` / etc. — requires the caller's
  JWT to carry at least one of the listed roles. No decorator means
  "any authenticated user."

## Resource groups

| Prefix | Covers |
|---|---|
| `/providers` | Public explore/search + profile; `/providers/me/*` for the authenticated provider's own profile, services, pricing, availability, media, transport preference |
| `/bookings` | Create (customer), accept/reject/cancel/start/complete, `mine` / `provider` listings |
| `/payments` | Initiate a payment for a booking, mock-simulate, and the gateway webhook endpoint |
| `/reviews` | Create (completed bookings only), public listing by target, report |
| `/messages` | Per-booking in-app messaging |
| `/notifications` | List/mark-read for the current user |
| `/pricing` | Provider-triggered demand suggestions (generate/accept/reject), admin rule management |
| `/verification` | Provider identity/health verification requests + document upload, admin review queue |
| `/accommodation` | Public partner/room browsing, booking requests, admin partner/room management |
| `/transport` | Provider-facing proxy to the separate transport-service |
| `/safety` | Trusted contacts, block/report, emergency alerts, check-in/out, admin report/alert resolution |
| `/disputes` | Raise (customer/provider), admin resolution |
| `/admin` | User management, booking oversight, platform analytics |

## Payment flow (why there's no "mark as paid" endpoint)

```
POST /payments/bookings/:bookingId/initiate
   → creates a Payment row (status CREATED) via the active PaymentProvider
   → returns { paymentId, providerOrderId, clientFields }

# Local dev / demo — MockPaymentProvider:
POST /payments/:paymentId/simulate   { outcome: SUCCEEDED | FAILED }
   → builds a real HMAC-signed webhook body exactly like a gateway would
   → feeds it through the SAME code path as the endpoint below

# Real gateway (Razorpay) or the mock's self-call above:
POST /payments/webhooks/:provider
   → verifies the HMAC signature against the raw request bytes
     (enabled via NestFactory.create(AppModule, { rawBody: true }))
   → looks up the Payment by provider order id
   → deduplicates on PaymentEvent.providerEventId (unique constraint)
   → only on a verified SUCCEEDED event: marks the payment SUCCEEDED and
     calls BookingsService.onPaymentVerified, which transitions
     PENDING_PAYMENT → PAYMENT_VERIFIED → CONFIRMED and fires the
     payment.verified / booking.confirmed Kafka events
```

There is deliberately no endpoint that lets the frontend directly mark a
booking as paid — the webhook path is the only route to `CONFIRMED`. The
`/payments/:paymentId/simulate` endpoint is Mock-provider-only precisely
so the "never trust the frontend" rule stays true even in local dev: it
doesn't skip verification, it just plays the role of the gateway.

## Errors

`AllExceptionsFilter` normalizes every error response to:

```json
{ "statusCode": 400, "path": "/api/v1/bookings", "timestamp": "...", "message": "..." }
```

Unhandled (non-`HttpException`) errors are logged server-side with a
stack trace and returned to the client as a generic 500 — internals are
never leaked in the response body.

## Rate limiting

Global default: 60 requests/minute per IP (`ThrottlerModule.forRoot`).
`/auth/register` and `/auth/login` have tighter, explicit limits
(5/min and 10/min respectively) via `@Throttle(...)`.
