'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';

interface Dispute {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  booking: { bookingNumber: string; status: string };
  raisedBy: { email: string };
}

function DisputeRow({ dispute }: { dispute: Dispute }) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState('');
  const [outcome, setOutcome] = useState<'COMPLETED' | 'CANCELLED'>('COMPLETED');

  const resolve = useMutation({
    mutationFn: (status: 'RESOLVED' | 'REJECTED') =>
      apiClient.post(`/disputes/${dispute.id}/resolve`, { status, bookingOutcome: outcome, resolution }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-cream-100">{dispute.booking.bookingNumber}</p>
          <p className="text-xs text-cream-400/50">Raised by {dispute.raisedBy.email}</p>
        </div>
        <Badge variant="danger">{dispute.status}</Badge>
      </div>
      <p className="mt-3 text-sm text-cream-300/80">{dispute.reason}</p>
      {dispute.details && <p className="mt-1 text-xs text-cream-400/50">{dispute.details}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as 'COMPLETED' | 'CANCELLED')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Keep booking completed</SelectItem>
              <SelectItem value="CANCELLED">Cancel & refund booking</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea placeholder="Resolution notes" value={resolution} onChange={(e) => setResolution(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => resolve.mutate('RESOLVED')} disabled={resolve.isPending}>
          Resolve
        </Button>
        <Button size="sm" variant="outline" onClick={() => resolve.mutate('REJECTED')} disabled={resolve.isPending}>
          Reject dispute
        </Button>
      </div>
    </Card>
  );
}

export default function AdminDisputesPage() {
  const { data: disputes = [] } = useQuery<Dispute[]>({
    queryKey: ['admin', 'disputes'],
    queryFn: async () => (await apiClient.get('/disputes/admin')).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Disputes</h1>
      {disputes.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">No open disputes.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {disputes.map((d) => (
            <DisputeRow key={d.id} dispute={d} />
          ))}
        </div>
      )}
    </div>
  );
}
