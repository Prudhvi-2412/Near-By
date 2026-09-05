'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Inbox, CalendarCheck, Wallet, Star } from 'lucide-react';
import { Button, Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { useProviderProfile } from '../../../../hooks/use-provider-profile';
import { CreateProfileForm } from '../../../../components/provider/create-profile-form';
import { StatCard } from '../../../../components/dashboard/stat-card';
import { BookingStatusBadge } from '../../../../components/booking/status-badge';
import { formatINR } from '../../../../lib/format';
import type { BookingSummary } from '../../../../types/booking';

export default function ProviderDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProviderProfile();

  const { data: bookings = [] } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'provider'],
    queryFn: async () => (await apiClient.get('/bookings/provider')).data,
    enabled: !!profile,
  });

  if (profileLoading) return <p className="text-sm text-cream-400/50">Loading…</p>;
  if (!profile) return <CreateProfileForm />;

  const pending = bookings.filter((b) => b.status === 'REQUESTED');
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED');
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalEarnings = completed.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Welcome, {profile.displayName}</h1>
        <p className="mt-1 text-cream-400/60">Here&apos;s how things are looking.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Pending requests" value={pending.length} />
        <StatCard icon={CalendarCheck} label="Upcoming" value={upcoming.length} />
        <StatCard icon={Wallet} label="Total earnings" value={formatINR(totalEarnings)} />
        <StatCard icon={Star} label="Rating" value={Number(profile.ratingAverage).toFixed(1)} hint={`${profile.ratingCount} reviews`} />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-cream-50">Pending requests</h2>
          <Button asChild variant="link">
            <Link href="/provider/bookings">View all</Link>
          </Button>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-cream-400/60">No pending requests right now.</p>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/provider/bookings/${b.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20"
              >
                <div>
                  <p className="text-sm font-medium text-cream-100">{b.customer?.email}</p>
                  <p className="text-xs text-cream-400/50">{new Date(b.scheduledStart).toLocaleString()}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
