'use client';

import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { formatINR } from '../../../../lib/format';
import type { PlatformAnalytics } from '../../../../types/admin';

export default function AdminAnalyticsPage() {
  const { data } = useQuery<PlatformAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => (await apiClient.get('/admin/analytics')).data,
  });

  if (!data) return <p className="text-sm text-cream-400/50">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-cream-50">Platform analytics</h1>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Revenue trend</h2>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.bookingTrends}>
              <XAxis dataKey="date" stroke="#9c8f7a" fontSize={11} />
              <YAxis stroke="#9c8f7a" fontSize={11} />
              <Tooltip contentStyle={{ background: '#17151a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#c9a227" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Top providers</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-cream-400/50">
              <th className="pb-2">Provider</th>
              <th className="pb-2">City</th>
              <th className="pb-2">Completed</th>
              <th className="pb-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {data.topProviders.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-3 text-cream-100">{p.displayName}</td>
                <td className="py-3 text-cream-300/70">{p.city}</td>
                <td className="py-3 text-cream-300/70">{p.completedBookingsCount}</td>
                <td className="py-3 text-gold-300">{Number(p.ratingAverage).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-6 text-sm text-cream-300/70">
        Total platform revenue to date: <span className="font-display text-gold-300">{formatINR(data.totalRevenue)}</span>
      </Card>
    </div>
  );
}
