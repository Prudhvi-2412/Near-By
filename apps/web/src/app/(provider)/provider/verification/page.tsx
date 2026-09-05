'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, HeartPulse, Upload } from 'lucide-react';
import { Badge, Button, Card } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';
import type { VerificationRequest } from '../../../../types/verification';

const STATUS_VARIANT = { PENDING: 'gold', APPROVED: 'success', REJECTED: 'danger' } as const;

function VerificationCard({ type, label, icon: Icon }: { type: 'IDENTITY' | 'HEALTH'; label: string; icon: typeof ShieldCheck }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: requests = [] } = useQuery<VerificationRequest[]>({
    queryKey: ['verification', 'mine'],
    queryFn: async () => (await apiClient.get('/verification/requests/mine')).data,
  });

  const latest = requests.filter((r) => r.type === type).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  const createRequest = useMutation({
    mutationFn: () => apiClient.post('/verification/requests', { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verification', 'mine'] }),
  });

  async function handleFile(file: File) {
    if (!latest) return;
    setUploading(true);
    try {
      const { data } = await apiClient.post(`/verification/requests/${latest.id}/upload-url`, { contentType: file.type });
      await fetch(data.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await apiClient.post(`/verification/requests/${latest.id}/documents`, { key: data.key, fileType: file.type });
      queryClient.invalidateQueries({ queryKey: ['verification', 'mine'] });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gold-400" />
          <h2 className="font-display text-lg text-cream-50">{label}</h2>
        </div>
        {latest && <Badge variant={STATUS_VARIANT[latest.status]}>{latest.status}</Badge>}
      </div>

      {!latest ? (
        <Button className="mt-4" onClick={() => createRequest.mutate()} disabled={createRequest.isPending}>
          Start {label.toLowerCase()}
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          {latest.status === 'APPROVED' && latest.verifiedAt && (
            <p className="text-sm text-emerald-300">
              {label} completed · Verified on {new Date(latest.verifiedAt).toLocaleDateString()}
              {latest.expiresAt && ` · Renew by ${new Date(latest.expiresAt).toLocaleDateString()}`}
            </p>
          )}
          {latest.status === 'REJECTED' && (
            <p className="text-sm text-red-300">Rejected: {latest.rejectionReason ?? 'No reason provided'}</p>
          )}
          {latest.status === 'PENDING' && (
            <>
              <p className="text-sm text-cream-400/60">
                {latest.documents.length} document(s) uploaded. Our team will review shortly.
              </p>
              <input
                ref={inputRef}
                type="file"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload document'}
              </Button>
            </>
          )}
          {(latest.status === 'REJECTED' || (latest.status === 'APPROVED' && latest.expiresAt && new Date(latest.expiresAt) < new Date())) && (
            <Button size="sm" onClick={() => createRequest.mutate()} disabled={createRequest.isPending}>
              Submit again
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ProviderVerificationPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Verification</h1>
        <p className="mt-1 text-cream-400/60">
          Documents are stored privately and only reviewed by our team — never shown publicly.
        </p>
      </div>
      <VerificationCard type="IDENTITY" label="Identity verification" icon={ShieldCheck} />
      <VerificationCard type="HEALTH" label="Health verification" icon={HeartPulse} />
      <p className="text-xs text-cream-400/40">
        Health verification reflects a completed voluntary check at a point in time. It is not a
        guarantee of current health status.
      </p>
    </div>
  );
}
