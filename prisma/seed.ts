import { PrismaClient, RoleName, BookingStatus, PaymentProviderType, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function hash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function bookingNumber(seq: number): string {
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  return `NB-${stamp}-${String(seq).padStart(4, '0')}`;
}

async function main() {
  console.log('Seeding Near By...');

  // ---- Roles ----
  const roleNames: RoleName[] = ['CUSTOMER', 'PROVIDER', 'ADMIN'];
  const roles: Record<RoleName, string> = {} as Record<RoleName, string>;
  for (const name of roleNames) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    roles[name] = role.id;
  }

  // ---- Admin ----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nearby.app' },
    update: {},
    create: {
      email: 'admin@nearby.app',
      passwordHash: hash('Admin@12345'),
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roles.ADMIN }] },
    },
  });

  // ---- Customers ----
  const customerSeed = [
    { email: 'priya.customer@nearby.app', name: 'Priya' },
    { email: 'rahul.customer@nearby.app', name: 'Rahul' },
    { email: 'meera.customer@nearby.app', name: 'Meera' },
  ];
  const customers: Record<string, string> = {};
  for (const c of customerSeed) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash: hash('Customer@123'),
        emailVerifiedAt: new Date(),
        roles: { create: [{ roleId: roles.CUSTOMER }] },
      },
    });
    customers[c.name] = user.id;
  }

  await prisma.trustedContact.upsert({
    where: { id: 'seed-trusted-contact-priya' },
    update: {},
    create: {
      id: 'seed-trusted-contact-priya',
      userId: customers.Priya,
      name: 'Ananya (sister)',
      phone: '+919876500011',
      relationship: 'Sister',
    },
  });

  // ---- Providers ----
  type ProviderSeed = {
    email: string;
    displayName: string;
    slug: string;
    city: string;
    bio: string;
    tags: string[];
    availabilityStatus: 'AVAILABLE_NOW' | 'AVAILABLE_LATER' | 'BUSY' | 'UNAVAILABLE';
    identityVerification: 'VERIFIED' | 'PENDING' | 'NONE';
    health: 'APPROVED' | 'PENDING' | null;
    basePrice: number;
  };

  const providerSeeds: ProviderSeed[] = [
    {
      email: 'ananya.provider@nearby.app',
      displayName: 'Ananya R.',
      slug: 'ananya-r-mumbai',
      city: 'Mumbai',
      bio: 'Elegant companionship for dinners, gallery openings, and social evenings. Fluent conversation in English and Hindi.',
      tags: ['Dinner Dates', 'Events', 'Conversation'],
      availabilityStatus: 'AVAILABLE_NOW',
      identityVerification: 'VERIFIED',
      health: 'APPROVED',
      basePrice: 4000,
    },
    {
      email: 'kavya.provider@nearby.app',
      displayName: 'Kavya M.',
      slug: 'kavya-m-bengaluru',
      city: 'Bengaluru',
      bio: 'Warm, well-travelled companion for corporate events and quiet dinners alike.',
      tags: ['Corporate Events', 'Dinner Dates', 'Travel'],
      availabilityStatus: 'AVAILABLE_LATER',
      identityVerification: 'VERIFIED',
      health: 'PENDING',
      basePrice: 5000,
    },
    {
      email: 'isha.provider@nearby.app',
      displayName: 'Isha K.',
      slug: 'isha-k-delhi',
      city: 'Delhi',
      bio: 'Thoughtful company for art, theatre, and evening walks around the city.',
      tags: ['Theatre', 'Art', 'Conversation'],
      availabilityStatus: 'BUSY',
      identityVerification: 'PENDING',
      health: null,
      basePrice: 3500,
    },
    {
      email: 'zara.provider@nearby.app',
      displayName: 'Zara F.',
      slug: 'zara-f-pune',
      city: 'Pune',
      bio: 'Bright, easygoing companion for weekend getaways and social events.',
      tags: ['Weekend Getaways', 'Events'],
      availabilityStatus: 'AVAILABLE_NOW',
      identityVerification: 'VERIFIED',
      health: 'APPROVED',
      basePrice: 4500,
    },
    {
      email: 'nisha.provider@nearby.app',
      displayName: 'Nisha P.',
      slug: 'nisha-p-goa',
      city: 'Goa',
      bio: 'Relaxed beachside companionship — sunset walks, dinners, and good conversation.',
      tags: ['Beach', 'Dinner Dates'],
      availabilityStatus: 'UNAVAILABLE',
      identityVerification: 'VERIFIED',
      health: null,
      basePrice: 4800,
    },
  ];

  const providerIds: Record<string, string> = {};
  const pricingIds: Record<string, string[]> = {};

  for (const p of providerSeeds) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash: hash('Provider@123'),
        emailVerifiedAt: new Date(),
        roles: { create: [{ roleId: roles.PROVIDER }] },
      },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: p.displayName,
        slug: p.slug,
        bio: p.bio,
        city: p.city,
        country: 'IN',
        languages: ['English', 'Hindi'],
        tags: p.tags,
        availabilityStatus: p.availabilityStatus,
        identityVerification: p.identityVerification,
        ratingAverage: 0,
        ratingCount: 0,
      },
    });
    providerIds[p.displayName] = profile.id;

    const service = await prisma.providerService.create({
      data: {
        providerId: profile.id,
        name: 'Companionship',
        description: 'General companionship for social occasions.',
      },
    });

    const durations = [30, 60, 90, 120];
    pricingIds[p.displayName] = [];
    for (const duration of durations) {
      const multiplier = duration / 60;
      const tier = await prisma.providerPricing.create({
        data: {
          providerId: profile.id,
          serviceId: service.id,
          durationMinutes: duration,
          price: Math.round(p.basePrice * multiplier * 0.92 * 100) / 100,
          currency: 'INR',
        },
      });
      pricingIds[p.displayName].push(tier.id);
    }

    // Availability slots for the next 5 days, two open slots per day.
    for (let day = 1; day <= 5; day++) {
      const morning = addMinutes(addDays(new Date(), day), 10 * 60);
      const evening = addMinutes(addDays(new Date(), day), 18 * 60);
      await prisma.providerAvailabilitySlot.createMany({
        data: [
          { providerId: profile.id, startTime: morning, endTime: addMinutes(morning, 120) },
          { providerId: profile.id, startTime: evening, endTime: addMinutes(evening, 120) },
        ],
      });
    }

    // Identity verification
    if (p.identityVerification !== 'NONE') {
      const identityRequest = await prisma.verificationRequest.create({
        data: {
          providerId: profile.id,
          type: 'IDENTITY',
          status: p.identityVerification === 'VERIFIED' ? 'APPROVED' : 'PENDING',
          reviewedAt: p.identityVerification === 'VERIFIED' ? new Date() : null,
          reviewedBy: p.identityVerification === 'VERIFIED' ? admin.id : null,
          verifiedAt: p.identityVerification === 'VERIFIED' ? new Date() : null,
        },
      });
      await prisma.verificationDocument.create({
        data: {
          verificationRequestId: identityRequest.id,
          fileKey: `verification/${profile.id}/identity-id.pdf`,
          fileType: 'application/pdf',
        },
      });
    }

    // Health verification
    if (p.health) {
      const healthRequest = await prisma.verificationRequest.create({
        data: {
          providerId: profile.id,
          type: 'HEALTH',
          status: p.health === 'APPROVED' ? 'APPROVED' : 'PENDING',
          reviewedAt: p.health === 'APPROVED' ? new Date() : null,
          reviewedBy: p.health === 'APPROVED' ? admin.id : null,
          verifiedAt: p.health === 'APPROVED' ? new Date() : null,
          expiresAt: p.health === 'APPROVED' ? addDays(new Date(), 180) : null,
        },
      });
      await prisma.verificationDocument.create({
        data: {
          verificationRequestId: healthRequest.id,
          fileKey: `verification/${profile.id}/health-certificate.pdf`,
          fileType: 'application/pdf',
        },
      });
    }

    await prisma.providerTransportPreference.upsert({
      where: { providerId: profile.id },
      update: {},
      create: { providerId: profile.id, usesTransport: true, preferredVehicleType: 'Sedan' },
    });
  }

  // ---- Bookings across the lifecycle ----
  let seq = 1;

  async function createBooking(opts: {
    customerId: string;
    providerName: string;
    pricingIndex: number;
    durationMinutes: number;
    status: BookingStatus;
    daysFromNow: number;
    withPayment?: boolean;
    withReview?: { rating: number; comment: string };
    cancelled?: { reason: string; by: string };
  }) {
    const providerId = providerIds[opts.providerName];
    const pricingId = pricingIds[opts.providerName][opts.pricingIndex];
    const pricing = await prisma.providerPricing.findUniqueOrThrow({ where: { id: pricingId } });
    const start = addDays(new Date(), opts.daysFromNow);
    const end = addMinutes(start, opts.durationMinutes);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: bookingNumber(seq++),
        customerId: opts.customerId,
        providerId,
        status: opts.status,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes: opts.durationMinutes,
        city: providerSeeds.find((p) => p.displayName === opts.providerName)!.city,
        totalAmount: pricing.price,
        currency: 'INR',
        cancellationReason: opts.cancelled?.reason,
        cancelledBy: opts.cancelled?.by,
        items: {
          create: [
            {
              providerPricingId: pricing.id,
              label: `Companionship (${opts.durationMinutes} min)`,
              durationMinutes: opts.durationMinutes,
              unitPrice: pricing.price,
              quantity: 1,
              subtotal: pricing.price,
            },
          ],
        },
        statusHistory: {
          create: [{ toStatus: opts.status, reason: 'Seed data' }],
        },
      },
    });

    if (opts.withPayment) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: PaymentProviderType.MOCK,
          providerOrderId: `mock_order_${booking.id}`,
          amount: pricing.price,
          currency: 'INR',
          status: PaymentStatus.SUCCEEDED,
          idempotencyKey: `seed_${booking.id}`,
        },
      });
    }

    if (opts.withReview) {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          authorId: opts.customerId,
          targetId: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } })).userId,
          targetType: 'PROVIDER',
          rating: opts.withReview.rating,
          comment: opts.withReview.comment,
        },
      });
      const agg = await prisma.review.aggregate({
        where: { targetId: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } })).userId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.providerProfile.update({
        where: { id: providerId },
        data: {
          ratingAverage: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
          completedBookingsCount: { increment: opts.status === 'COMPLETED' ? 1 : 0 },
        },
      });
    }

    return booking;
  }

  await createBooking({
    customerId: customers.Priya,
    providerName: 'Ananya R.',
    pricingIndex: 1,
    durationMinutes: 60,
    status: 'COMPLETED',
    daysFromNow: -3,
    withPayment: true,
    withReview: { rating: 5, comment: 'Wonderful evening — great conversation and very professional.' },
  });

  await createBooking({
    customerId: customers.Rahul,
    providerName: 'Zara F.',
    pricingIndex: 2,
    durationMinutes: 90,
    status: 'COMPLETED',
    daysFromNow: -7,
    withPayment: true,
    withReview: { rating: 4, comment: 'Really enjoyed the evening, would book again.' },
  });

  await createBooking({
    customerId: customers.Meera,
    providerName: 'Kavya M.',
    pricingIndex: 1,
    durationMinutes: 60,
    status: 'CONFIRMED',
    daysFromNow: 2,
    withPayment: true,
  });

  await createBooking({
    customerId: customers.Priya,
    providerName: 'Isha K.',
    pricingIndex: 0,
    durationMinutes: 30,
    status: 'REQUESTED',
    daysFromNow: 4,
  });

  await createBooking({
    customerId: customers.Rahul,
    providerName: 'Ananya R.',
    pricingIndex: 0,
    durationMinutes: 30,
    status: 'CANCELLED',
    daysFromNow: 1,
    cancelled: { reason: 'Customer had a scheduling conflict.', by: customers.Rahul },
  });

  await createBooking({
    customerId: customers.Meera,
    providerName: 'Zara F.',
    pricingIndex: 1,
    durationMinutes: 60,
    status: 'IN_PROGRESS',
    daysFromNow: 0,
    withPayment: true,
  });

  // ---- Pricing intelligence ----
  await prisma.pricingRule.createMany({
    data: [
      {
        name: 'Peak Hour Demand Multiplier',
        description: 'Increases suggested price when available-provider supply is low relative to booking demand.',
        ruleType: 'DEMAND_MULTIPLIER',
        config: { multiplier: 1.15, lowSupplyThreshold: 2 },
      },
      {
        name: 'Weekend Evening Boost',
        description: 'Small suggested increase for Friday/Saturday evening bookings.',
        ruleType: 'TIME_OF_DAY',
        config: { days: ['FRI', 'SAT'], startHour: 18, endHour: 23, multiplier: 1.1 },
      },
    ],
  });

  const ananyaPricing = await prisma.providerPricing.findFirstOrThrow({
    where: { providerId: providerIds['Ananya R.'], durationMinutes: 60 },
  });
  await prisma.pricingSuggestion.create({
    data: {
      providerId: providerIds['Ananya R.'],
      providerPricingId: ananyaPricing.id,
      currentPrice: ananyaPricing.price,
      suggestedPrice: Math.round(Number(ananyaPricing.price) * 1.1 * 100) / 100,
      demandLevel: 'HIGH',
      availableProvidersCount: 1,
      reasoning: 'Demand for Mumbai this weekend is high relative to the number of available providers.',
      status: 'PENDING',
    },
  });

  // ---- Accommodation ----
  const oberoi = await prisma.accommodationPartner.create({
    data: { name: 'The Oberoi Residences', city: 'Mumbai', description: 'Premium serviced suites in South Mumbai.' },
  });
  await prisma.accommodationRoom.createMany({
    data: [
      { partnerId: oberoi.id, name: 'Deluxe Suite', capacity: 2, pricePerNight: 18000 },
      { partnerId: oberoi.id, name: 'Executive Suite', capacity: 2, pricePerNight: 26000 },
    ],
  });

  const goaVillas = await prisma.accommodationPartner.create({
    data: { name: 'Goa Beachfront Villas', city: 'Goa', description: 'Private villas minutes from the beach.' },
  });
  const villaRoom = await prisma.accommodationRoom.create({
    data: { partnerId: goaVillas.id, name: 'Sea View Villa', capacity: 4, pricePerNight: 22000 },
  });
  await prisma.accommodationBooking.create({
    data: {
      roomId: villaRoom.id,
      requestedById: customers.Priya,
      checkIn: addDays(new Date(), 10),
      checkOut: addDays(new Date(), 12),
      status: 'REQUESTED',
      totalAmount: 44000,
    },
  });

  // ---- Transportation ----
  const driverSeed = [
    { name: 'Suresh Patil', phone: '+919876543210', license: 'MH-DL-0001', make: 'Toyota', model: 'Innova', plate: 'MH12AB1234' },
    { name: 'Vikram Nair', phone: '+919876543211', license: 'KA-DL-0002', make: 'Honda', model: 'City', plate: 'KA05CD5678' },
    { name: 'Arjun Singh', phone: '+919876543212', license: 'DL-DL-0003', make: 'Maruti', model: 'Ertiga', plate: 'DL09EF9012' },
  ];
  const driverIds: string[] = [];
  const vehicleIds: string[] = [];
  for (const d of driverSeed) {
    const driver = await prisma.driver.create({
      data: { name: d.name, phone: d.phone, licenseNumber: d.license },
    });
    driverIds.push(driver.id);
    const vehicle = await prisma.vehicle.create({
      data: { driverId: driver.id, make: d.make, model: d.model, plateNumber: d.plate, capacity: 4 },
    });
    vehicleIds.push(vehicle.id);
  }

  await prisma.transportRequest.create({
    data: {
      requesterId: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerIds['Ananya R.'] } })).userId,
      pickupLocation: 'Bandra West, Mumbai',
      dropoffLocation: 'Lower Parel, Mumbai',
      status: 'COMPLETED',
      vehicleId: vehicleIds[0],
      driverId: driverIds[0],
      fare: 450,
      startedAt: addMinutes(new Date(), -90),
      completedAt: addMinutes(new Date(), -45),
    },
  });

  await prisma.transportRequest.create({
    data: {
      requesterId: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerIds['Zara F.'] } })).userId,
      pickupLocation: 'Koregaon Park, Pune',
      dropoffLocation: 'Viman Nagar, Pune',
      status: 'REQUESTED',
    },
  });

  // ---- Notifications ----
  await prisma.notification.createMany({
    data: [
      {
        userId: customers.Meera,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking confirmed',
        body: 'Your booking with Kavya M. has been confirmed.',
        channel: 'IN_APP',
      },
      {
        userId: (await prisma.providerProfile.findUniqueOrThrow({ where: { id: providerIds['Ananya R.'] } })).userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment received',
        body: 'Payment for your completed booking has been received.',
        channel: 'IN_APP',
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Admin login: admin@nearby.app / Admin@12345');
  console.log('Customer login: priya.customer@nearby.app / Customer@123');
  console.log('Provider login: ananya.provider@nearby.app / Provider@123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
