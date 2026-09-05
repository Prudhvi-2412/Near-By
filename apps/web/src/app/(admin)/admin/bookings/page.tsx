'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Input } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import { BookingStatusBadge } from '../../../../components/booking/status-badge';
import { formatINR } from '../../../../lib/format';

interface AdminBooking {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledStart: string;
  city: string;
  totalAmount: string | number;
  provider: { displayName: string };
  customer: { email: string };
}

export default function AdminBookingsPage() {
  const [city, setCity] = useState('');

  const { data } = useQuery<{ items: AdminBooking[]; total: number }>({
    queryKey: ['admin', 'bookings', city],
    queryFn: async () => (await apiClient.get('/admin/bookings', { params: { city: city || undefined } })).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-cream-50">Bookings</h1>
        <Input placeholder="Filter by city" className="w-56" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-cream-400/50">
              <th className="p-4">Booking</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Provider</th>
              <th className="p-4">When</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((b) => (
              <tr key={b.id} className="border-b border-white/5">
                <td className="p-4 text-cream-100">{b.bookingNumber}</td>
                <td className="p-4 text-cream-300/70">{b.customer.email}</td>
                <td className="p-4 text-cream-300/70">{b.provider.displayName}</td>
                <td className="p-4 text-cream-400/50">{new Date(b.scheduledStart).toLocaleString()}</td>
                <td className="p-4 text-gold-300">{formatINR(Number(b.totalAmount))}</td>
                <td className="p-4">
                  <BookingStatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
