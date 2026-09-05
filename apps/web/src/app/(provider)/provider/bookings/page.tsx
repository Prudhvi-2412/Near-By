'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, TabsList, TabsTrigger } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { BookingStatusBadge } from '../../../../components/booking/status-badge';
import { formatINR } from '../../../../lib/format';
import type { BookingSummary } from '../../../../types/booking';

const TABS = [
  { value: 'REQUESTED', label: 'Requests' },
  { value: 'CONFIRMED', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ALL', label: 'All' },
];

export default function ProviderBookingsPage() {
  const [tab, setTab] = useState('REQUESTED');
  const { data: bookings = [], isLoading } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'provider'],
    queryFn: async () => (await apiClient.get('/bookings/provider')).data,
  });

  const filtered = tab === 'ALL' ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Bookings</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-cream-400/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">Nothing here yet.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/provider/bookings/${b.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-5 hover:border-white/20">
                <div>
                  <p className="text-sm font-medium text-cream-100">{b.customer?.email}</p>
                  <p className="text-xs text-cream-400/50">
                    {b.bookingNumber} · {new Date(b.scheduledStart).toLocaleString()}
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
