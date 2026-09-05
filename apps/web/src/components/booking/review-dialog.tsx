'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from '@near-by/ui';
import { apiClient } from '../../lib/api-client';

export function ReviewDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: () => apiClient.post('/reviews', { bookingId, rating, comment: comment || undefined }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">Leave a review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)}>
              <Star className={`h-8 w-8 ${star <= rating ? 'fill-gold-400 text-gold-400' : 'text-cream-400/30'}`} />
            </button>
          ))}
        </div>
        <Textarea
          className="mt-4"
          rows={4}
          placeholder="Share a few words about your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
