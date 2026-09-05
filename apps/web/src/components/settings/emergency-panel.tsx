'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Button, Card, Textarea } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

export function EmergencyPanel() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const trigger = useMutation({
    mutationFn: () => apiClient.post('/safety/emergency-alerts', { message: message || undefined }),
    onSuccess: () => setSent(true),
  });

  return (
    <Card className="border-red-500/20 bg-red-500/[0.03] p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <h2 className="font-display text-lg text-cream-50">Emergency assistance</h2>
      </div>
      <p className="mt-1 text-sm text-cream-400/60">
        If you feel unsafe, raise an alert and our safety team will be notified immediately.
      </p>
      {sent ? (
        <p className="mt-4 text-sm text-emerald-300">Alert sent — our team has been notified.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <Textarea
            rows={2}
            placeholder="Optional details"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="destructive" disabled={trigger.isPending} onClick={() => trigger.mutate()}>
            {trigger.isPending ? 'Sending…' : 'Raise emergency alert'}
          </Button>
        </div>
      )}
    </Card>
  );
}
