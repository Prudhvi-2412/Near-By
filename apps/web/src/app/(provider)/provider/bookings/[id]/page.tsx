'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Textarea } from '@near-by/ui';
import { apiClient } from '../../../../../lib/api-client';
import { BookingStatusBadge } from '../../../../../components/booking/status-badge';
import { formatINR } from '../../../../../lib/format';
import type { BookingDetail } from '../../../../../types/booking';

function RejectDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const reject = useMutation({
    mutationFn: () => apiClient.post(`/bookings/${bookingId}/reject`, { reason }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Reject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this booking?</DialogTitle>
        </DialogHeader>
        <Textarea rows={3} placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={reason.length < 3 || reject.isPending} onClick={() => reject.mutate()}>
            Confirm reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProviderBookingDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const { data: booking, isLoading } = useQuery<BookingDetail>({
    queryKey: ['booking', params.id],
    queryFn: async () => (await apiClient.get(`/bookings/${params.id}`)).data,
  });

  const action = useMutation({
    mutationFn: (path: string) => apiClient.post(`/bookings/${params.id}/${path}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', params.id] }),
  });

  if (isLoading || !booking) return <p className="text-sm text-cream-400/50">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-400/80">{booking.bookingNumber}</p>
          <h1 className="mt-1 font-display text-3xl text-cream-50">Booking with {booking.customer?.email}</h1>
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
        {booking.meetingNotes && <p className="mt-4 border-t border-white/5 pt-4 text-sm text-cream-300/70">{booking.meetingNotes}</p>}
      </Card>

      <div className="flex flex-wrap gap-3">
        {booking.status === 'REQUESTED' && (
          <>
            <Button onClick={() => action.mutate('accept')} disabled={action.isPending}>
              Accept
            </Button>
            <RejectDialog bookingId={booking.id} />
          </>
        )}
        {booking.status === 'CONFIRMED' && (
          <Button onClick={() => action.mutate('start')} disabled={action.isPending}>
            Mark in progress
          </Button>
        )}
        {booking.status === 'IN_PROGRESS' && (
          <Button onClick={() => action.mutate('complete')} disabled={action.isPending}>
            Mark completed
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/provider/messages?bookingId=${booking.id}`}>Message customer</Link>
        </Button>
      </div>
    </div>
  );
}
