import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ProviderMeProfile } from '../types/provider-me';

export function useProviderProfile() {
  return useQuery<ProviderMeProfile | null>({
    queryKey: ['provider', 'me'],
    queryFn: async () => {
      try {
        return (await apiClient.get('/providers/me')).data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
  });
}
