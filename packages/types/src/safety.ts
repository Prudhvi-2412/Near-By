import { z } from 'zod';

export const trustedContactSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
  relationship: z.string().max(40).optional(),
});

export type TrustedContactInput = z.infer<typeof trustedContactSchema>;

export const reportUserSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedBookingId: z.string().uuid().optional(),
  reason: z.string().min(3).max(120),
  details: z.string().max(1000).optional(),
});

export type ReportUserInput = z.infer<typeof reportUserSchema>;

export const emergencyAlertSchema = z.object({
  bookingId: z.string().uuid().optional(),
  message: z.string().max(300).optional(),
});

export type EmergencyAlertInput = z.infer<typeof emergencyAlertSchema>;
