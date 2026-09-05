'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  reporter: { email: string };
  createdAt: string;
}

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ['admin', 'reports'],
    queryFn: async () => (await apiClient.get('/safety/admin/reports', { params: { status: 'OPEN' } })).data,
  });

  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) =>
      apiClient.post(`/safety/admin/reports/${id}/resolve`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Reported content</h1>
      {reports.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">No open reports.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-cream-100">{r.reason}</p>
                <Badge variant="danger">{r.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-cream-400/50">Reported by {r.reporter.email}</p>
              {r.details && <p className="mt-2 text-sm text-cream-300/70">{r.details}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: 'RESOLVED' })}>
                  Resolve
                </Button>
                <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: 'DISMISSED' })}>
                  Dismiss
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
