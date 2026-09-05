'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { useProviderProfile } from '../../../../hooks/use-provider-profile';
import { CreateProfileForm } from '../../../../components/provider/create-profile-form';
import { AVAILABILITY_LABEL } from '../../../../lib/format';

const STATUSES = ['AVAILABLE_NOW', 'AVAILABLE_LATER', 'BUSY', 'UNAVAILABLE'];

export default function ProviderAvailabilityPage() {
  const { data: profile, isLoading } = useProviderProfile();
  const queryClient = useQueryClient();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const setStatus = useMutation({
    mutationFn: (status: string) => apiClient.patch('/providers/me/availability-status', { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  const addSlot = useMutation({
    mutationFn: () =>
      apiClient.post('/providers/me/availability-slots', {
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      }),
    onSuccess: () => {
      setStart('');
      setEnd('');
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
  });

  const removeSlot = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/providers/me/availability-slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  if (isLoading) return <p className="text-sm text-cream-400/50">Loading…</p>;
  if (!profile) return <CreateProfileForm />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Availability</h1>
        <p className="mt-1 text-cream-400/60">Control your real-time status and open time slots.</p>
      </div>

      <Card className="p-6">
        <Label>Current status</Label>
        <Select value={profile.availabilityStatus} onValueChange={(v) => setStatus.mutate(v)}>
          <SelectTrigger className="mt-2 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {AVAILABILITY_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Open slots</h2>
        <div className="mt-4 space-y-2">
          {profile.availabilitySlots.length === 0 && <p className="text-sm text-cream-400/60">No upcoming open slots.</p>}
          {profile.availabilitySlots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-cream-100">
                {new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleTimeString()}
              </span>
              <button onClick={() => removeSlot.mutate(slot.id)} className="text-cream-400/50 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/5 pt-6 sm:grid-cols-3">
          <div>
            <Label>Start</Label>
            <Input className="mt-1" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>End</Label>
            <Input className="mt-1" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={!start || !end || addSlot.isPending} onClick={() => addSlot.mutate()}>
              Add slot
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
