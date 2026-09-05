'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Label, Textarea } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

export function CreateProfileForm() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');

  const create = useMutation({
    mutationFn: () => apiClient.post('/providers/me', { displayName, city, bio: bio || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  return (
    <Card className="mx-auto max-w-lg p-8">
      <h1 className="font-display text-2xl text-cream-50">Set up your provider profile</h1>
      <p className="mt-2 text-sm text-cream-400/60">
        This is what customers will see. You can add photos, services, and pricing next.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <Label>Display name</Label>
          <Input className="mt-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label>City</Label>
          <Input className="mt-2" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea className="mt-2" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <Button className="w-full" disabled={!displayName || !city || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? 'Creating…' : 'Create profile'}
        </Button>
      </div>
    </Card>
  );
}
