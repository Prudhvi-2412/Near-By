import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Lightweight, Kafka-fed counters for the admin "today at a glance" widgets.
 * The full historical/aggregate analytics (revenue trends, booking funnels)
 * are computed on demand straight from Postgres in AdminService — these
 * Redis counters exist purely because they're driven by the event stream in
 * real time and would be wasteful to recompute per request.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly redis: RedisService) {}

  async incrementCounter(name: string, by = 1) {
    await this.redis.client.incrby(`analytics:${name}:${dayKey()}`, by);
  }

  async incrementAmount(name: string, amount: number) {
    await this.redis.client.incrbyfloat(`analytics:${name}:${dayKey()}`, amount);
  }

  async getTodayCounters() {
    const keys = ['bookings_created', 'bookings_completed', 'payments_verified', 'ratings_submitted'];
    const values = await Promise.all(keys.map((k) => this.redis.client.get(`analytics:${k}:${dayKey()}`)));
    const revenue = await this.redis.client.get(`analytics:revenue:${dayKey()}`);
    return {
      date: dayKey(),
      bookingsCreated: Number(values[0] ?? 0),
      bookingsCompleted: Number(values[1] ?? 0),
      paymentsVerified: Number(values[2] ?? 0),
      ratingsSubmitted: Number(values[3] ?? 0),
      revenueToday: Number(revenue ?? 0),
    };
  }
}
