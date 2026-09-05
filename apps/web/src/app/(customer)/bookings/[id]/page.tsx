'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@near-by/ui';
import { Button } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { BookingStatusBadge } from '../../../../components/booking/status-badge';
import { CancelBookingDialog } from '../../../../components/booking/cancel-dialog';
import { ReviewDialog } from '../../../../components/booking/review-dialog';
import { formatINR } from '../../../../lib/format';
import type { BookingDetail } from '../../../../types/booking';

export default function CustomerBookingDetailPage({ params }: { params: { id: string } }) {
  const { data: booking, isLoading } = useQuery<BookingDetail>({
    queryKey: ['booking', params.id],
    queryFn: async () => (await apiClient.get(`/bookings/${params.id}`)).data,
  });

  if (isLoading || !booking) {
    return <p className="text-sm text-cream-400/50">Loading booking…</p>;
  }

  const canCancel = ['REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status);
  const canPay = booking.status === 'PENDING_PAYMENT';
  const canReview = booking.status === 'COMPLETED';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-400/80">{booking.bookingNumber}</p>
          <h1 className="mt-1 font-display text-3xl text-cream-50">Booking with {booking.provider?.displayName}</h1>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <dt className="text-cream-400/50">When</dt>
            <dd className="mt-1 text-cream-100">{new Date(booking.scheduledStart).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-cream-400/50">City</dt>
            <dd className="mt-1 text-cream-100">{booking.city}</dd>
          </div>
          <div>
            <dt className="text-cream-400/50">Total</dt>
            <dd className="mt-1 font-display text-lg text-gold-300">{formatINR(Number(booking.totalAmount))}</dd>
          </div>
          <div>
            <dt className="text-cream-400/50">Duration</dt>
            <dd className="mt-1 text-cream-100">{booking.items[0]?.durationMinutes} minutes</dd>
          </div>
        </dl>
        {booking.meetingNotes && (
          <p className="mt-4 border-t border-white/5 pt-4 text-sm text-cream-300/70">
            <span className="text-cream-400/50">Notes: </span>
            {booking.meetingNotes}
          </p>
        )}
        {booking.cancellationReason && (
          <p className="mt-4 border-t border-white/5 pt-4 text-sm text-red-300/80">
            Cancelled: {booking.cancellationReason}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Status history</h2>
        <ol className="mt-4 space-y-3 border-l border-white/10 pl-4">
          {booking.statusHistory.map((h) => (
            <li key={h.id} className="text-sm">
              <p className="text-cream-100">{h.toStatus.replaceAll('_', ' ')}</p>
              <p className="text-xs text-cream-400/50">{new Date(h.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex flex-wrap gap-3">
        {canPay && (
          <Button asChild>
            <Link href={`/bookings/${booking.id}/checkout`}>Proceed to payment</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/messages?bookingId=${booking.id}`}>Message provider</Link>
        </Button>
        {canReview && <ReviewDialog bookingId={booking.id} />}
        {canCancel && <CancelBookingDialog bookingId={booking.id} />}
      </div>
    </div>
  );
}
