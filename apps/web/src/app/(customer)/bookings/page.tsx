'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../lib/api-client';
import { BookingStatusBadge } from '../../../components/booking/status-badge';
import { formatINR } from '../../../lib/format';
import type { BookingSummary } from '../../../types/booking';

export default function CustomerBookingsPage() {
  const { data: bookings = [], isLoading } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'mine'],
    queryFn: async () => (await apiClient.get('/bookings/mine')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cream-50">My bookings</h1>
        <p className="mt-1 text-cream-400/60">Every booking you&apos;ve made, past and upcoming.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-cream-400/50">Loading…</p>
      ) : bookings.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">You haven&apos;t made any bookings yet.</Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-white/20">
                <div>
                  <p className="text-sm font-medium text-cream-100">{b.provider?.displayName}</p>
                  <p className="text-xs text-cream-400/50">
                    {b.bookingNumber} · {new Date(b.scheduledStart).toLocaleString()} · {b.city}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-gold-300">{formatINR(Number(b.totalAmount))}</span>
                  <BookingStatusBadge status={b.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
