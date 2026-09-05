'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button, Card } from '@near-by/ui';
import { apiClient } from '../../../../../lib/api-client';
import type { BookingDetail } from '../../../../../types/booking';

export default function PaymentResultPage({ params }: { params: { id: string } }) {
  const { data: booking, isLoading } = useQuery<BookingDetail>({
    queryKey: ['booking', params.id],
    queryFn: async () => (await apiClient.get(`/bookings/${params.id}`)).data,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING_PAYMENT' ? 2000 : false),
  });

  const status = booking?.status;
  const confirmed = status === 'CONFIRMED' || status === 'PAYMENT_VERIFIED';
  const failed = booking?.payments?.some((p) => p.status === 'FAILED') && status === 'PENDING_PAYMENT';

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <Card className="p-10">
        {isLoading ? (
          <>
            <Clock className="mx-auto h-12 w-12 animate-pulse text-cream-400/50" />
            <p className="mt-4 text-cream-300/70">Checking payment status…</p>
          </>
        ) : confirmed ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
            <h1 className="mt-4 font-display text-2xl text-cream-50">Booking confirmed!</h1>
            <p className="mt-2 text-cream-300/70">
              Your payment was verified and your booking is now confirmed. The provider has been notified.
            </p>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-400" />
            <h1 className="mt-4 font-display text-2xl text-cream-50">Payment failed</h1>
            <p className="mt-2 text-cream-300/70">Your payment could not be verified. You can try again from the booking page.</p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-12 w-12 animate-pulse text-gold-400" />
            <p className="mt-4 text-cream-300/70">Waiting for payment confirmation…</p>
          </>
        )}

        <Button asChild className="mt-8 w-full">
          <Link href={`/bookings/${params.id}`}>View booking details</Link>
        </Button>
      </Card>
    </div>
  );
}
