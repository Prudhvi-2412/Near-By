import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import type { RoleName, UserStatus } from '@prisma/client';

function subDays(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60_000);
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async listUsers(params: { role?: RoleName; status?: UserStatus; search?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      status: params.status,
      ...(params.role ? { roles: { some: { role: { name: params.role } } } } : {}),
      ...(params.search
        ? { OR: [{ email: { contains: params.search, mode: 'insensitive' as const } }] }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } }, providerProfile: { select: { displayName: true, city: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  async listBookings(params: { status?: string; city?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.city ? { city: { equals: params.city, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { provider: { select: { displayName: true } }, customer: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async platformAnalytics() {
    const [
      totalUsers,
      totalProviders,
      activeBookings,
      completedBookings,
      revenueAgg,
      pendingVerifications,
      openDisputes,
      openReports,
      recentBookings,
      topProviders,
      todayCounters,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.providerProfile.count({ where: { isActive: true } }),
      this.prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT', 'REQUESTED'] } } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
      this.prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.booking.findMany({
        where: { createdAt: { gte: subDays(14) } },
        select: { createdAt: true, totalAmount: true, status: true },
      }),
      this.prisma.providerProfile.findMany({
        orderBy: [{ completedBookingsCount: 'desc' }],
        take: 5,
        select: { id: true, displayName: true, city: true, completedBookingsCount: true, ratingAverage: true },
      }),
      this.analytics.getTodayCounters(),
    ]);

    const trendMap = new Map<string, { bookings: number; revenue: number }>();
    for (const b of recentBookings) {
      const day = b.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(day) ?? { bookings: 0, revenue: 0 };
      entry.bookings += 1;
      if (b.status === 'COMPLETED') entry.revenue += Number(b.totalAmount);
      trendMap.set(day, entry);
    }
    const bookingTrends = Array.from(trendMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsers,
      totalProviders,
      activeBookings,
      completedBookings,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      pendingVerifications,
      openDisputes,
      openReports,
      bookingTrends,
      topProviders,
      today: todayCounters,
    };
  }
}
