'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Button, Input } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../hooks/use-auth';
import type { Message } from '../../types/message';

export function Conversation({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', bookingId],
    queryFn: async () => (await apiClient.get(`/messages/booking/${bookingId}`)).data,
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: () => apiClient.post('/messages', { bookingId, body }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
    },
  });

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && <p className="text-center text-sm text-cream-400/50">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? 'bg-gradient-to-r from-burgundy-600 to-burgundy-700 text-cream-50' : 'bg-white/[0.06] text-cream-100'
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-2 border-t border-white/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) send.mutate();
        }}
      >
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" size="icon" disabled={send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
