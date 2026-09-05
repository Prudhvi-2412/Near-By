'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Label, Textarea } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { useProviderProfile } from '../../../../hooks/use-provider-profile';
import { CreateProfileForm } from '../../../../components/provider/create-profile-form';
import { ImageUploader } from '../../../../components/provider/image-uploader';
import { ProviderImage } from '../../../../components/media/provider-image';

export default function ProviderProfileEditorPage() {
  const { data: profile, isLoading } = useProviderProfile();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ displayName: '', bio: '', city: '', state: '', tags: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        bio: profile.bio ?? '',
        city: profile.city,
        state: profile.state ?? '',
        tags: profile.tags.join(', '),
      });
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: () =>
      apiClient.patch('/providers/me', {
        displayName: form.displayName,
        bio: form.bio || undefined,
        city: form.city,
        state: form.state || undefined,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  if (isLoading) return <p className="text-sm text-cream-400/50">Loading…</p>;
  if (!profile) return <CreateProfileForm />;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Profile editor</h1>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Photos</h2>
        <div className="mt-4 flex items-center gap-4">
          <ProviderImage src={profile.coverImageKey ? `${process.env.NEXT_PUBLIC_API_URL}` : null} name={profile.displayName} className="h-20 w-20 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <ImageUploader kind="cover" label="Upload cover photo" />
            <ImageUploader kind="gallery" label="Add gallery photo" />
          </div>
        </div>
        <p className="mt-3 text-xs text-cream-400/50">{profile.galleryImageKeys.length} gallery photo(s) uploaded.</p>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg text-cream-50">Profile details</h2>
        <div>
          <Label>Display name</Label>
          <Input className="mt-2" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea className="mt-2" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input className="mt-2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>State</Label>
            <Input className="mt-2" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Tags (comma separated)</Label>
          <Input className="mt-2" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <Button disabled={update.isPending} onClick={() => update.mutate()}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Card>
    </div>
  );
}
