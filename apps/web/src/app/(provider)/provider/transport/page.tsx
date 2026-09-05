'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car } from 'lucide-react';
import { Button, Card, Input, Label, Switch } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';

interface TransportPreference {
  usesTransport: boolean;
  preferredVehicleType: string | null;
  notes: string | null;
}

interface RideRequest {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  requestedAt: string;
}

export default function ProviderTransportPage() {
  const queryClient = useQueryClient();
  const { data: preference } = useQuery<TransportPreference>({
    queryKey: ['transport-preference'],
    queryFn: async () => (await apiClient.get('/providers/me/transport-preference')).data,
  });

  const { data: rides = [] } = useQuery<RideRequest[]>({
    queryKey: ['transport-requests'],
    queryFn: async () => (await apiClient.get('/transport/requests/mine')).data,
  });

  const [vehicleType, setVehicleType] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  useEffect(() => {
    if (preference) setVehicleType(preference.preferredVehicleType ?? '');
  }, [preference]);

  const updatePreference = useMutation({
    mutationFn: (usesTransport: boolean) =>
      apiClient.patch('/providers/me/transport-preference', { usesTransport, preferredVehicleType: vehicleType || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-preference'] }),
  });

  const requestRide = useMutation({
    mutationFn: () => apiClient.post('/transport/requests', { pickupLocation: pickup, dropoffLocation: dropoff }),
    onSuccess: () => {
      setPickup('');
      setDropoff('');
      queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Transportation</h1>
        <p className="mt-1 text-cream-400/60">Manage your ride preferences and request transportation.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cream-100">Use platform transportation</p>
            <p className="text-xs text-cream-400/50">Enable to request rides for your bookings.</p>
          </div>
          <Switch checked={!!preference?.usesTransport} onCheckedChange={(v) => updatePreference.mutate(v)} />
        </div>
        <div className="mt-4">
          <Label>Preferred vehicle type</Label>
          <Input className="mt-2" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Sedan, SUV…" />
          <Button className="mt-3" size="sm" variant="outline" onClick={() => updatePreference.mutate(!!preference?.usesTransport)}>
            Save preference
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-gold-400" />
          <h2 className="font-display text-lg text-cream-50">Request a ride</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Pickup</Label>
            <Input className="mt-2" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </div>
          <div>
            <Label>Drop-off</Label>
            <Input className="mt-2" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" disabled={!pickup || !dropoff || requestRide.isPending} onClick={() => requestRide.mutate()}>
          Request ride
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Trip history</h2>
        <div className="mt-4 space-y-2">
          {rides.length === 0 && <p className="text-sm text-cream-400/60">No rides requested yet.</p>}
          {rides.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
              <span className="text-cream-100">
                {r.pickupLocation} → {r.dropoffLocation}
              </span>
              <span className="text-xs uppercase tracking-wide text-cream-400/60">{r.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
