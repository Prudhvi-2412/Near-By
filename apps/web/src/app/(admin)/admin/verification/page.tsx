'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Textarea } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';

interface QueueItem {
  id: string;
  type: 'IDENTITY' | 'HEALTH';
  status: string;
  provider: { displayName: string; city: string };
  documents: { id: string; fileType: string }[];
}

function QueueRow({ item }: { item: QueueItem }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const review = useMutation({
    mutationFn: (status: 'APPROVED' | 'REJECTED') =>
      apiClient.post(`/verification/admin/requests/${item.id}/review`, { status, rejectionReason: status === 'REJECTED' ? reason : undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'verification-queue'] }),
  });

  async function viewDocument(docId: string) {
    const { data } = await apiClient.get(`/verification/admin/documents/${docId}/url`);
    window.open(data, '_blank');
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-cream-100">{item.provider.displayName}</p>
          <p className="text-xs text-cream-400/50">{item.provider.city}</p>
        </div>
        <Badge variant="gold">{item.type}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.documents.map((d) => (
          <Button key={d.id} size="sm" variant="outline" onClick={() => viewDocument(d.id)}>
            View document
          </Button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={2}
        placeholder="Rejection reason (if rejecting)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => review.mutate('APPROVED')} disabled={review.isPending}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={() => review.mutate('REJECTED')} disabled={review.isPending}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

export default function AdminVerificationPage() {
  const { data: queue = [] } = useQuery<QueueItem[]>({
    queryKey: ['admin', 'verification-queue'],
    queryFn: async () => (await apiClient.get('/verification/admin/queue', { params: { status: 'PENDING' } })).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Verification queue</h1>
      {queue.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">No pending verification requests.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {queue.map((item) => (
            <QueueRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
