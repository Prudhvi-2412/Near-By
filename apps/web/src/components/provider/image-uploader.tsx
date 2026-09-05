'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { Button } from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

export function ImageUploader({ kind, label }: { kind: 'cover' | 'gallery'; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const attach = useMutation({
    mutationFn: (key: string) =>
      apiClient.post(`/providers/me/media/${kind === 'cover' ? 'cover' : 'gallery'}`, { key }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { data } = await apiClient.post('/providers/me/media/upload-url', {
        contentType: file.type,
        kind,
      });
      await fetch(data.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await attach.mutateAsync(data.key);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : label}
      </Button>
    </div>
  );
}
