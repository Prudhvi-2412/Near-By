import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reportReviewSchema = z.object({
  reason: z.string().min(3).max(300),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
