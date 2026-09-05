'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button, Card, Textarea, Label } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../hooks/use-auth';
import { formatINR } from '../../lib/format';
import type { ProviderDetail } from '../../types/provider-detail';

export function BookingWidget({ provider }: { provider: ProviderDetail }) {
  const router = useRouter();
  const { isAuthenticated, roles } = useAuth();
  const [pricingId, setPricingId] = useState<string | null>(provider.pricing[0]?.id ?? null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const selectedPricing = provider.pricing.find((p) => p.id === pricingId);

  const eligibleSlots = useMemo(() => {
    if (!selectedPricing) return [];
    return provider.availabilitySlots.filter((slot) => {
      const durationMs = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime();
      return durationMs >= selectedPricing.durationMinutes * 60_000;
    });
  }, [provider.availabilitySlots, selectedPricing]);

  const createBooking = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/bookings', {
        providerPricingId: pricingId,
        availabilitySlotId: slotId,
        meetingNotes: notes || undefined,
      });
      return data;
    },
    onSuccess: (data) => router.push(`/bookings/${data.id}`),
  });

  if (!provider.pricing.length) {
    return (
      <Card className="p-6 text-sm text-cream-300/70">This provider hasn&apos;t published pricing yet.</Card>
    );
  }

  return (
    <Card className="sticky top-28 space-y-5 p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Book {provider.displayName}</p>
        <p className="mt-1 text-sm text-cream-400/60">Choose a duration and an available time slot.</p>
      </div>

      <div className="space-y-2">
        {provider.pricing.map((tier) => (
          <button
            key={tier.id}
            onClick={() => {
              setPricingId(tier.id);
              setSlotId(null);
            }}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              pricingId === tier.id
                ? 'border-gold-400/60 bg-gold-500/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <span className="text-sm text-cream-100">{tier.durationMinutes} minutes</span>
            <span className="font-display text-gold-300">{formatINR(Number(tier.price))}</span>
          </button>
        ))}
      </div>

      {selectedPricing && (
        <div>
          <Label>Available slots</Label>
          {eligibleSlots.length === 0 ? (
            <p className="mt-2 text-sm text-cream-400/60">No open slots long enough for this duration right now.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {eligibleSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSlotId(slot.id)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    slotId === slot.id
                      ? 'border-gold-400/60 bg-gold-500/10 text-gold-200'
                      : 'border-white/10 bg-white/[0.02] text-cream-300/80 hover:border-white/20'
                  }`}
                >
                  {format(new Date(slot.startTime), 'EEE d MMM, h:mm a')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes for the provider (optional)</Label>
        <Textarea
          id="notes"
          className="mt-2"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the provider should know ahead of time"
        />
      </div>

      {createBooking.isError && (
        <p className="text-sm text-red-400">
          {(createBooking.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Something went wrong — please try again.'}
        </p>
      )}

      {!isAuthenticated ? (
        <Button className="w-full" onClick={() => router.push('/login?next=' + encodeURIComponent(`/providers/${provider.slug}`))}>
          Log in to book
        </Button>
      ) : !roles.includes('CUSTOMER') ? (
        <p className="text-center text-sm text-cream-400/60">Only customer accounts can create bookings.</p>
      ) : (
        <Button
          className="w-full"
          disabled={!pricingId || !slotId || createBooking.isPending}
          onClick={() => createBooking.mutate()}
        >
          {createBooking.isPending ? 'Requesting…' : 'Request booking'}
        </Button>
      )}

      <p className="text-center text-[11px] text-cream-400/40">
        Your exact meeting location is only shared after the booking is confirmed.
      </p>
    </Card>
  );
}
