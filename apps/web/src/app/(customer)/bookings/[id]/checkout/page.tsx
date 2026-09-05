'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@near-by/ui';
import { apiClient } from '../../../../../lib/api-client';
import { formatINR } from '../../../../../lib/format';
import type { BookingDetail } from '../../../../../types/booking';

interface InitiateResult {
  paymentId: string;
  amount: number;
  currency: string;
  provider: 'MOCK' | 'RAZORPAY';
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<InitiateResult | null>(null);

  const { data: booking } = useQuery<BookingDetail>({
    queryKey: ['booking', params.id],
    queryFn: async () => (await apiClient.get(`/bookings/${params.id}`)).data,
  });

  const initiate = useMutation({
    mutationFn: async () => (await apiClient.post<InitiateResult>(`/payments/bookings/${params.id}/initiate`)).data,
    onSuccess: setOrder,
  });

  const simulate = useMutation({
    mutationFn: async (outcome: 'SUCCEEDED' | 'FAILED') =>
      apiClient.post(`/payments/${order?.paymentId}/simulate`, { outcome }),
    onSuccess: () => router.push(`/bookings/${params.id}/payment-result`),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Secure checkout</p>
        <h1 className="mt-1 font-display text-3xl text-cream-50">Complete your payment</h1>
      </div>

      <Card className="space-y-4 p-6">
        {booking && (
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-sm text-cream-300/70">Booking {booking.bookingNumber}</span>
            <span className="font-display text-xl text-gold-300">{formatINR(Number(booking.totalAmount))}</span>
          </div>
        )}

        {!order ? (
          <Button className="w-full" onClick={() => initiate.mutate()} disabled={initiate.isPending}>
            {initiate.isPending ? 'Preparing payment…' : 'Initiate payment'}
          </Button>
        ) : order.provider === 'MOCK' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/[0.06] p-4 text-xs text-cream-300/80">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold-400" />
              This is the local mock payment provider — it exercises the exact same webhook
              verification path a real gateway would, without charging anything.
            </div>
            <Button
              className="w-full"
              variant="primary"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate('SUCCEEDED')}
            >
              <CheckCircle2 className="h-4 w-4" /> Simulate successful payment
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate('FAILED')}
            >
              <XCircle className="h-4 w-4" /> Simulate failed payment
            </Button>
          </div>
        ) : (
          <p className="text-sm text-cream-300/70">
            Redirecting to Razorpay checkout for order {order.paymentId}…
          </p>
        )}
      </Card>

      <p className="text-center text-xs text-cream-400/40">
        Your booking is only confirmed once the payment is verified via webhook — never from this page alone.
      </p>
    </div>
  );
}
