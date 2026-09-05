'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Input } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import type { AdminUser } from '../../../../types/admin';

const STATUS_VARIANT = { ACTIVE: 'success', SUSPENDED: 'gold', BANNED: 'danger' } as const;

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery<{ items: AdminUser[]; total: number }>({
    queryKey: ['admin', 'users', search],
    queryFn: async () => (await apiClient.get('/admin/users', { params: { search: search || undefined } })).data,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.post(`/admin/users/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-cream-50">Users</h1>
        <Input placeholder="Search by email" className="w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-cream-400/50">
              <th className="p-4">Email</th>
              <th className="p-4">Roles</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-4 text-cream-100">{u.email}</td>
                <td className="p-4 text-cream-300/70">{u.roles.map((r) => r.role.name).join(', ')}</td>
                <td className="p-4">
                  <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
                </td>
                <td className="p-4 text-cream-400/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {u.status !== 'ACTIVE' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: u.id, status: 'ACTIVE' })}>
                        Activate
                      </Button>
                    )}
                    {u.status !== 'SUSPENDED' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: u.id, status: 'SUSPENDED' })}>
                        Suspend
                      </Button>
                    )}
                    {u.status !== 'BANNED' && (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: u.id, status: 'BANNED' })}>
                        Ban
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
