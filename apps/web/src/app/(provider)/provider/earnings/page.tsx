'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Wallet, CalendarCheck, Star } from 'lucide-react';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { StatCard } from '../../../../components/dashboard/stat-card';
import { formatINR } from '../../../../lib/format';
import type { BookingSummary } from '../../../../types/booking';

export default function ProviderEarningsPage() {
  const { data: bookings = [] } = useQuery<BookingSummary[]>({
    queryKey: ['bookings', 'provider'],
    queryFn: async () => (await apiClient.get('/bookings/provider')).data,
  });

  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalEarnings = completed.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of completed) {
      const key = new Date(b.scheduledStart).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      map.set(key, (map.get(key) ?? 0) + Number(b.totalAmount));
    }
    return Array.from(map.entries()).map(([month, earnings]) => ({ month, earnings }));
  }, [completed]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-cream-50">Earnings</h1>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Total earnings" value={formatINR(totalEarnings)} />
        <StatCard icon={CalendarCheck} label="Completed bookings" value={completed.length} />
        <StatCard icon={Star} label="Average per booking" value={formatINR(completed.length ? totalEarnings / completed.length : 0)} />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Earnings by month</h2>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis dataKey="month" stroke="#9c8f7a" fontSize={12} />
              <YAxis stroke="#9c8f7a" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#17151a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#f5efe6' }}
              />
              <Bar dataKey="earnings" fill="#c9a227" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Recent completed bookings</h2>
        <div className="mt-4 space-y-2">
          {completed.slice(0, 10).map((b) => (
            <div key={b.id} className="flex items-center justify-between border-b border-white/5 py-2 text-sm">
              <span className="text-cream-300/80">{new Date(b.scheduledStart).toLocaleDateString()}</span>
              <span className="font-display text-gold-300">{formatINR(Number(b.totalAmount))}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
