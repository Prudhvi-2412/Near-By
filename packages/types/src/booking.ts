import { z } from 'zod';

export const createBookingSchema = z.object({
  providerPricingId: z.string().uuid(),
  availabilitySlotId: z.string().uuid(),
  meetingNotes: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const rejectBookingSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
