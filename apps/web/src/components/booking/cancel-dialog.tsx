'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Textarea } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

export function CancelBookingDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const cancel = useMutation({
    mutationFn: () => apiClient.post(`/bookings/${bookingId}/cancel`, { reason }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel booking</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="Reason for cancelling"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep booking
          </Button>
          <Button variant="destructive" disabled={reason.length < 3 || cancel.isPending} onClick={() => cancel.mutate()}>
            {cancel.isPending ? 'Cancelling…' : 'Confirm cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
