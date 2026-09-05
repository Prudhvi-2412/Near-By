'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, Card, Input, Label } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export function TrustedContactsPanel() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const { data: contacts = [] } = useQuery<TrustedContact[]>({
    queryKey: ['trusted-contacts'],
    queryFn: async () => (await apiClient.get('/safety/trusted-contacts')).data,
  });

  const add = useMutation({
    mutationFn: () => apiClient.post('/safety/trusted-contacts', { name, phone, relationship: relationship || undefined }),
    onSuccess: () => {
      setName('');
      setPhone('');
      setRelationship('');
      queryClient.invalidateQueries({ queryKey: ['trusted-contacts'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/safety/trusted-contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trusted-contacts'] }),
  });

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg text-cream-50">Trusted contacts</h2>
      <p className="mt-1 text-sm text-cream-400/60">Share your bookings with someone you trust for extra peace of mind.</p>

      <div className="mt-4 space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm text-cream-100">{c.name}</p>
              <p className="text-xs text-cream-400/50">
                {c.phone} {c.relationship ? `· ${c.relationship}` : ''}
              </p>
            </div>
            <button onClick={() => remove.mutate(c.id)} className="text-cream-400/50 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Label>Name</Label>
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sm:col-span-1">
          <Label>Phone</Label>
          <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="sm:col-span-1">
          <Label>Relationship</Label>
          <Input className="mt-1" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        </div>
        <div className="flex items-end sm:col-span-1">
          <Button className="w-full" disabled={!name || !phone || add.isPending} onClick={() => add.mutate()}>
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
