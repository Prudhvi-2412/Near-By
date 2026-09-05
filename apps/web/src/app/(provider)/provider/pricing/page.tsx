'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Card, Input, Label } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { useProviderProfile } from '../../../../hooks/use-provider-profile';
import { CreateProfileForm } from '../../../../components/provider/create-profile-form';
import { formatINR } from '../../../../lib/format';

interface PricingSuggestion {
  id: string;
  providerPricingId: string;
  currentPrice: string | number;
  suggestedPrice: string | number;
  demandLevel: string;
  reasoning: string;
}

function AddPricingForm({ serviceId }: { serviceId?: string }) {
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');

  const create = useMutation({
    mutationFn: () =>
      apiClient.post('/providers/me/pricing', {
        serviceId,
        durationMinutes: Number(duration),
        price: Number(price),
      }),
    onSuccess: () => {
      setPrice('');
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
  });

  return (
    <div className="flex items-end gap-3">
      <div>
        <Label>Duration (min)</Label>
        <Input className="mt-1 w-28" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      <div>
        <Label>Price (₹)</Label>
        <Input className="mt-1 w-32" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <Button disabled={!price || create.isPending} onClick={() => create.mutate()}>
        Add tier
      </Button>
    </div>
  );
}

export default function ProviderPricingPage() {
  const { data: profile, isLoading } = useProviderProfile();
  const queryClient = useQueryClient();
  const [newService, setNewService] = useState('');

  const { data: suggestions = [] } = useQuery<PricingSuggestion[]>({
    queryKey: ['pricing-suggestions'],
    queryFn: async () => (await apiClient.get('/pricing/suggestions/mine')).data,
    enabled: !!profile,
  });

  const createService = useMutation({
    mutationFn: () => apiClient.post('/providers/me/services', { name: newService }),
    onSuccess: () => {
      setNewService('');
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
  });

  const generateSuggestions = useMutation({
    mutationFn: () => apiClient.post('/pricing/suggestions/generate'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-suggestions'] }),
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      apiClient.post(`/pricing/suggestions/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
  });

  if (isLoading) return <p className="text-sm text-cream-400/50">Loading…</p>;
  if (!profile) return <CreateProfileForm />;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Pricing management</h1>
        <p className="mt-1 text-cream-400/60">You control every price. Suggestions are optional.</p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-cream-50">Demand-based suggestions</h2>
          <Button size="sm" variant="outline" onClick={() => generateSuggestions.mutate()} disabled={generateSuggestions.isPending}>
            <Sparkles className="h-4 w-4" /> Check demand
          </Button>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-cream-400/60">No active suggestions right now.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const up = Number(s.suggestedPrice) > Number(s.currentPrice);
              return (
                <div key={s.id} className="rounded-xl border border-gold-500/20 bg-gold-500/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {up ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                      <span className="text-cream-100">
                        {formatINR(Number(s.currentPrice))} → {formatINR(Number(s.suggestedPrice))}
                      </span>
                      <span className="text-xs text-cream-400/50">({s.demandLevel} demand)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: s.id, action: 'reject' })}>
                        Dismiss
                      </Button>
                      <Button size="sm" onClick={() => respond.mutate({ id: s.id, action: 'accept' })}>
                        Accept
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-cream-400/60">{s.reasoning}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Services & pricing tiers</h2>
        <div className="mt-4 space-y-6">
          {profile.services.map((service) => (
            <div key={service.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-medium text-cream-100">{service.name}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {profile.pricing
                  .filter((p) => p.serviceId === service.id)
                  .map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="text-cream-300/80">{tier.durationMinutes} min</span>
                      <span className="font-display text-gold-300">{formatINR(Number(tier.price))}</span>
                    </div>
                  ))}
              </div>
              <div className="mt-3">
                <AddPricingForm serviceId={service.id} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-end gap-3 border-t border-white/5 pt-6">
          <div className="flex-1">
            <Label>New service name</Label>
            <Input className="mt-1" value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="e.g. Dinner Date" />
          </div>
          <Button disabled={!newService || createService.isPending} onClick={() => createService.mutate()}>
            Add service
          </Button>
        </div>
      </Card>
    </div>
  );
}
