'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing } from 'lucide-react';
import { Button, Card } from '@near-by/ui';
import { apiClient } from '../../../lib/api-client';
import type { AppNotification } from '../../../types/notification';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => (await apiClient.get('/notifications/mine')).data,
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-cream-50">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">You&apos;re all caught up.</Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`flex items-start gap-4 p-4 ${!n.readAt ? 'border-gold-500/30' : ''}`}>
              {n.readAt ? (
                <Bell className="mt-0.5 h-5 w-5 text-cream-400/50" />
              ) : (
                <BellRing className="mt-0.5 h-5 w-5 text-gold-400" />
              )}
              <div>
                <p className="text-sm font-medium text-cream-100">{n.title}</p>
                <p className="text-sm text-cream-300/70">{n.body}</p>
                <p className="mt-1 text-xs text-cream-400/40">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
