# Near By

**Your time. Your terms. Your Near By.**

A premium, privacy-first marketplace for consenting adults and independent
service providers — worker-controlled pricing, real-time availability,
secure bookings, dynamic pricing intelligence, and trusted reputation.

> Everyone on the platform is treated as a consenting adult (18+). Near By
> does not host or permit explicit sexual content, and no verification
> feature (identity or health) is ever presented as a safety guarantee —
> see [docs/architecture.md](docs/architecture.md) and
> [Safety & Privacy](apps/web/src/app/(public)/safety/page.tsx) for the
> actual framing used throughout the product.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Docker](#docker)
- [Testing](#testing)
- [Documentation](#documentation)
- [AWS deployment](#aws-deployment)
- [Future improvements](#future-improvements)

## Features

- **Auth** — JWT access + rotating refresh tokens, bcrypt, role-based
  access control (customer/provider/admin), rate-limited login/register.
- **Provider marketplace** — searchable/filterable explore page, public
  profiles with galleries, services, worker-set pricing, and
  availability, without exposing sensitive personal details.
- **Worker-controlled pricing** — providers set their own duration-based
  price tiers and can change them any time; every change is recorded in
  a pricing history table.
- **Dynamic pricing intelligence** — a demand/supply/time-of-day heuristic
  engine *suggests* price changes; providers always accept or reject,
  the engine never writes a price directly.
- **Real-time availability** — `AVAILABLE_NOW/LATER/BUSY/UNAVAILABLE`
  status plus a real slot calendar, with a Redis lock + DB conditional
  update preventing two customers from booking the same slot.
- **Full booking lifecycle** — `REQUESTED → PENDING_PAYMENT →
  PAYMENT_VERIFIED → CONFIRMED → IN_PROGRESS → COMPLETED`, plus
  `CANCELLED/REJECTED/EXPIRED/DISPUTED`, with a guarded state machine and
  scheduled jobs for expiry/auto-start/auto-complete.
- **Payments** — a `PaymentProvider` abstraction with a `MockPaymentProvider`
  (for local dev/demo, exercising the exact same webhook-verification
  path a real gateway would) and a real `RazorpayPaymentProvider`
  (HMAC-SHA256 webhook verification, real Orders/Refunds API shapes).
- **Kafka event backbone** — `booking.*`, `payment.verified`,
  `availability.updated`, `provider.price-updated`, `notification.requested`,
  `rating.submitted`, `transport.*`, with a shared consumer base class
  handling retry + dead-letter topics.
- **Health & identity verification** — document upload to a private
  bucket, admin review queue, public display limited to
  "verified on [date]" — never medical details, never a safety guarantee.
- **Accommodation & transportation modules** — partner/room booking kept
  separate from the core booking flow; a fully separate, independently
  deployable transport-service for vehicles/drivers/ride requests.
- **Ratings & reputation**, **safety tooling** (trusted contacts,
  block/report, emergency alerts, check-in/out), **admin console**
  (users, verification, bookings, disputes, reports, pricing rules,
  analytics with live Kafka-fed counters).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components, Framer Motion, React Hook Form + Zod, TanStack Query |
| Backend | NestJS, TypeScript, PostgreSQL + Prisma, Redis, Kafka (KafkaJS) |
| Payments | Razorpay (real integration) behind a provider-agnostic interface, Mock provider for local dev |
| Infra | Docker Compose (local), Terraform reference for AWS (ECS Fargate, RDS, ElastiCache, MSK, S3, CloudFront, ALB, Secrets Manager, CloudWatch) |
| Testing | Jest (backend unit + e2e), Vitest + Testing Library (frontend) |

## Project structure

```
near-by/
├── apps/
│   └── web/                      Next.js — public site + customer/provider/admin dashboards
├── services/
│   ├── api/                       NestJS — auth, marketplace, pricing, booking, payments, Kafka, safety, admin
│   └── transport-service/          NestJS — vehicles, drivers, ride requests (separate deploy unit)
├── packages/
│   ├── ui/                          shared themed component library
│   ├── types/                        shared zod schemas / DTOs
│   ├── events/                        Kafka topic + payload contracts
│   └── config/                         shared config placeholder (real shared config is tsconfig.base.json)
├── prisma/                               schema.prisma, seed.ts
├── infrastructure/
│   ├── docker/                            per-service Dockerfiles
│   └── aws/                                Terraform reference (see docs/aws-deployment.md)
├── docs/                                     architecture.md, database.md, api.md, kafka-events.md, aws-deployment.md
├── docker-compose.yml
└── package.json                                npm workspaces root
```

## Local setup

Prerequisites: Node.js 20+, Docker Desktop.

```bash
npm install
cp .env.example .env                 # already provided, tweak if needed
npm run docker:up                    # postgres, redis, kafka, minio
npm run prisma:migrate               # creates the schema
npm run prisma:seed                  # sample providers, bookings, pricing, analytics

npm run dev:api                      # http://localhost:4000  (Swagger at /docs)
npm run dev:transport                # http://localhost:4100  (Swagger at /docs)
npm run dev:web                      # http://localhost:3000
```

Seeded logins (see `prisma/seed.ts`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@nearby.app` | `Admin@12345` |
| Customer | `priya.customer@nearby.app` | `Customer@123` |
| Provider | `ananya.provider@nearby.app` | `Provider@123` |

## Environment variables

See [`.env.example`](.env.example) (root — shared by both backend
services and Docker Compose) and [`apps/web/.env.example`](apps/web/.env.example).
Key groups: database/Redis/Kafka connection strings, S3/MinIO credentials
and bucket names, JWT secrets + TTLs, payment provider selection
(`PAYMENT_PROVIDER=mock|razorpay` plus Razorpay keys), notification
provider selection (console-only locally), and service ports/URLs.

## Docker

```bash
docker compose up -d postgres redis kafka minio minio-init   # infra only, for local `npm run dev:*`
docker compose up -d --build                                 # everything, including api/transport-service/web
```

Each app service has its own multi-stage Dockerfile under
`infrastructure/docker/`, healthchecked in `docker-compose.yml`
(`/health` for the two NestJS services, `/` for the Next.js app).

## Testing

```bash
npm run test --workspace=@near-by/api       # unit tests — booking state machine, pricing engine,
                                             # mock payment signature verification, auth service
npm run test:e2e --workspace=@near-by/api   # integration — booking concurrency, payment webhook
                                             # idempotency (needs docker compose up postgres redis)
npm run test --workspace=@near-by/web       # Vitest — formatting utils, form validation, components
```

The unit suite (28 tests) and the frontend suite (11 tests) require no
infrastructure and run in seconds. The two e2e suites
(`booking-concurrency.e2e-spec.ts`, `payment-webhook.e2e-spec.ts`) are
real integration tests against a live Postgres/Redis — see the header
comment in each file for exact setup.

## Documentation

- [docs/architecture.md](docs/architecture.md) — system diagram and the
  reasoning behind the non-obvious decisions (why no `apps/admin`, why no
  `middleware.ts`, how double-booking is actually prevented, how payments
  stay webhook-verified).
- [docs/database.md](docs/database.md) — schema conventions and table
  groups.
- [docs/api.md](docs/api.md) — auth flow, RBAC, resource groups, the
  payment webhook flow.
- [docs/kafka-events.md](docs/kafka-events.md) — topic catalogue,
  consumer groups, retry/DLQ, idempotency per consumer.
- [docs/aws-deployment.md](docs/aws-deployment.md) — how to actually run
  the Terraform in `infrastructure/aws`.

## AWS deployment

Terraform reference lives in [`infrastructure/aws`](infrastructure/aws) —
**not applied** from this environment (no AWS account/credentials here,
and provisioning billed infrastructure needs an explicit decision from
whoever owns the account). Full walkthrough:
[docs/aws-deployment.md](docs/aws-deployment.md).

## Future improvements

- A real-time layer (WebSocket/SSE) consuming `booking.confirmed`,
  `booking.cancelled`, and `availability.updated` for live UI updates
  instead of polling.
- Split `transport-service` onto its own RDS instance (the code already
  treats it as a separate bounded context; only the local dev database
  is currently shared).
- A drag/drop calendar UI for provider availability (currently a clean
  list-based add/remove view).
- CI pipeline (build → test → push images → `terraform apply`) — the
  pieces (Dockerfiles, Terraform, test suites) all exist independently
  but aren't yet wired into a pipeline definition.
- Multi-region and WAF hardening for the AWS topology, noted as
  out-of-scope in docs/aws-deployment.md.
