'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../lib/api-client';
import { Conversation } from '../../../components/messages/conversation';
import type { BookingSummary } from '../../../types/booking';

export default function CustomerMessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeBookingId = searchParams.get('bookingId');

  const { data: bookings = [] } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'mine'],
    queryFn: async () => (await apiClient.get('/bookings/mine')).data,
  });

  const active = activeBookingId ?? bookings[0]?.id;

  return (
    <div>
      <h1 className="font-display text-3xl text-cream-50">Messages</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="h-fit divide-y divide-white/5 p-2 md:col-span-1">
          {bookings.length === 0 && <p className="p-4 text-sm text-cream-400/50">No bookings yet.</p>}
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/messages?bookingId=${b.id}`)}
              className={`w-full rounded-xl p-4 text-left text-sm transition-colors ${
                active === b.id ? 'bg-white/[0.06] text-cream-50' : 'text-cream-300/70 hover:bg-white/[0.03]'
              }`}
            >
              <p className="font-medium">{b.provider?.displayName}</p>
              <p className="text-xs text-cream-400/50">{b.bookingNumber}</p>
            </button>
          ))}
        </Card>
        <div className="md:col-span-2">{active ? <Conversation bookingId={active} /> : null}</div>
      </div>
    </div>
  );
}
