'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Card } from '@near-by/ui';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/use-auth';
import type { Review } from '../../../types/review';

export default function RatingsPage() {
  const { user } = useAuth();
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['reviews', 'for', user?.id],
    queryFn: async () => (await apiClient.get(`/reviews/for/${user?.id}`)).data,
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cream-50">Ratings</h1>
        <p className="mt-1 text-cream-400/60">Reviews providers have left about you after completed bookings.</p>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-10 text-center text-cream-400/60">No reviews yet.</Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-400/30'}`} />
                ))}
              </div>
              {r.comment && <p className="mt-2 text-sm text-cream-300/80">{r.comment}</p>}
              <p className="mt-2 text-xs text-cream-400/40">{new Date(r.createdAt).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
