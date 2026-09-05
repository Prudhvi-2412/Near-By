'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, Wallet, Star } from 'lucide-react';
import { Button, Card } from '@near-by/ui';
import { apiClient } from '../../../lib/api-client';
import { StatCard } from '../../../components/dashboard/stat-card';
import { BookingStatusBadge } from '../../../components/booking/status-badge';
import { formatINR } from '../../../lib/format';
import type { BookingSummary } from '../../../types/booking';

export default function CustomerDashboardPage() {
  const { data: bookings = [] } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'mine'],
    queryFn: async () => (await apiClient.get('/bookings/mine')).data,
  });

  const upcoming = bookings.filter((b) => ['CONFIRMED', 'PENDING_PAYMENT', 'REQUESTED'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalSpent = completed.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Welcome back</h1>
        <p className="mt-1 text-cream-400/60">Here&apos;s what&apos;s happening with your bookings.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Upcoming" value={upcoming.length} />
        <StatCard icon={Clock} label="Completed" value={completed.length} />
        <StatCard icon={Wallet} label="Total spent" value={formatINR(totalSpent)} />
        <StatCard icon={Star} label="Total bookings" value={bookings.length} />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-cream-50">Upcoming bookings</h2>
          <Button asChild variant="link">
            <Link href="/bookings">View all</Link>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-cream-400/60">
            No upcoming bookings yet.{' '}
            <Link href="/explore" className="text-gold-300 hover:underline">
              Explore providers
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20"
              >
                <div>
                  <p className="text-sm font-medium text-cream-100">{b.provider?.displayName}</p>
                  <p className="text-xs text-cream-400/50">{new Date(b.scheduledStart).toLocaleString()} · {b.city}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
