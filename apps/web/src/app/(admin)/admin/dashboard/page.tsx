'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, CalendarCheck, Wallet, ShieldAlert } from 'lucide-react';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { StatCard } from '../../../../components/dashboard/stat-card';
import { formatINR } from '../../../../lib/format';
import type { PlatformAnalytics } from '../../../../types/admin';

export default function AdminDashboardPage() {
  const { data } = useQuery<PlatformAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await apiClient.get('/admin/analytics')).data,
    refetchInterval: 15000,
  });

  if (!data) return <p className="text-sm text-cream-400/50">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-cream-50">Platform overview</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} hint={`${data.totalProviders} providers`} />
        <StatCard icon={CalendarCheck} label="Active bookings" value={data.activeBookings} hint={`${data.completedBookings} completed`} />
        <StatCard icon={Wallet} label="Total revenue" value={formatINR(data.totalRevenue)} hint={`${formatINR(data.today.revenueToday)} today`} />
        <StatCard icon={ShieldAlert} label="Needs attention" value={data.pendingVerifications + data.openDisputes + data.openReports} hint="verifications + disputes + reports" />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Bookings, last 14 days</h2>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.bookingTrends}>
              <defs>
                <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a3244f" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#a3244f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9c8f7a" fontSize={11} />
              <YAxis stroke="#9c8f7a" fontSize={11} />
              <Tooltip contentStyle={{ background: '#17151a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="bookings" stroke="#c23d63" fill="url(#bookingsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 sm:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Bookings today" value={data.today.bookingsCreated} />
        <StatCard icon={CalendarCheck} label="Completed today" value={data.today.bookingsCompleted} />
        <StatCard icon={Wallet} label="Payments today" value={data.today.paymentsVerified} />
        <StatCard icon={Users} label="Ratings today" value={data.today.ratingsSubmitted} />
      </div>
    </div>
  );
}
