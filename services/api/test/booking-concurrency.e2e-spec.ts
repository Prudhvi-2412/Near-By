/**
 * Integration test for the double-booking guard described in docs/architecture.md:
 * a Redis lock serializes concurrent attempts on the same availability slot, and a
 * conditional `updateMany` inside a DB transaction is the actual source of truth.
 *
 * Requires a live Postgres + Redis — run `docker compose up -d postgres redis`
 * and `npm run prisma:migrate` from the repo root first, then:
 *   npm run test:e2e --workspace=@near-by/api
 */
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';
import { RedisModule } from '../src/common/redis/redis.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { KafkaProducerService } from '../src/common/kafka/kafka-producer.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { validateEnv } from '../src/common/config/env.validation';

describe('Booking slot concurrency (e2e)', () => {
  let prisma: PrismaService;
  let bookingsService: BookingsService;
  let providerId: string;
  let pricingId: string;
  let slotId: string;
  let customerAId: string;
  let customerBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'], validate: validateEnv }),
        PrismaModule,
        RedisModule,
      ],
      providers: [
        BookingsService,
        KafkaProducerService,
        { provide: PaymentsService, useValue: { refund: jest.fn() } },
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    bookingsService = moduleRef.get(BookingsService);
    await prisma.$connect();

    const role = await prisma.role.upsert({ where: { name: 'CUSTOMER' }, update: {}, create: { name: 'CUSTOMER' } });
    const providerRole = await prisma.role.upsert({ where: { name: 'PROVIDER' }, update: {}, create: { name: 'PROVIDER' } });

    const providerUser = await prisma.user.create({
      data: {
        email: `provider-${randomUUID()}@test.local`,
        passwordHash: 'x',
        roles: { create: [{ roleId: providerRole.id }] },
      },
    });
    const provider = await prisma.providerProfile.create({
      data: { userId: providerUser.id, displayName: 'Test Provider', slug: `test-${randomUUID()}`, city: 'Mumbai' },
    });
    providerId = provider.id;

    const pricing = await prisma.providerPricing.create({
      data: { providerId, durationMinutes: 60, price: 1000 },
    });
    pricingId = pricing.id;

    const slot = await prisma.providerAvailabilitySlot.create({
      data: {
        providerId,
        startTime: new Date(Date.now() + 24 * 60 * 60_000),
        endTime: new Date(Date.now() + 26 * 60 * 60_000),
      },
    });
    slotId = slot.id;

    const [customerA, customerB] = await Promise.all([
      prisma.user.create({
        data: { email: `customer-a-${randomUUID()}@test.local`, passwordHash: 'x', roles: { create: [{ roleId: role.id }] } },
      }),
      prisma.user.create({
        data: { email: `customer-b-${randomUUID()}@test.local`, passwordHash: 'x', roles: { create: [{ roleId: role.id }] } },
      }),
    ]);
    customerAId = customerA.id;
    customerBId = customerB.id;
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { providerId } });
    await prisma.providerAvailabilitySlot.deleteMany({ where: { providerId } });
    await prisma.providerPricing.deleteMany({ where: { providerId } });
    await prisma.providerProfile.deleteMany({ where: { id: providerId } });
    await prisma.user.deleteMany({ where: { id: { in: [customerAId, customerBId] } } });
    await prisma.$disconnect();
  });

  it('only allows exactly one of two simultaneous bookings for the same slot to succeed', async () => {
    const attempt = (customerId: string) =>
      bookingsService
        .createBooking(customerId, { providerPricingId: pricingId, availabilitySlotId: slotId })
        .then(() => 'fulfilled' as const)
        .catch(() => 'rejected' as const);

    const [resultA, resultB] = await Promise.all([attempt(customerAId), attempt(customerBId)]);
    const outcomes = [resultA, resultB];

    expect(outcomes.filter((o) => o === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'rejected')).toHaveLength(1);

    const slot = await prisma.providerAvailabilitySlot.findUniqueOrThrow({ where: { id: slotId } });
    expect(slot.status).toBe('BOOKED');

    const bookingsForSlot = await prisma.booking.count({
      where: { items: { some: { providerPricingId: pricingId } } },
    });
    expect(bookingsForSlot).toBe(1);
  });
});
