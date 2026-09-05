import { z } from 'zod';
import { AVAILABILITY_STATUSES } from './enums';

export const providerProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name is too short').max(60),
  bio: z.string().max(1500).optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  country: z.string().default('IN'),
  languages: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(12).default([]),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

export const providerServiceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export type ProviderServiceInput = z.infer<typeof providerServiceSchema>;

export const pricingTierSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().positive().max(1440),
  price: z.number().positive('Price must be greater than zero'),
  currency: z.string().default('INR'),
});

export type PricingTierInput = z.infer<typeof pricingTierSchema>;

export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES);

export const availabilitySlotSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

export const explorerFilterSchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  availableOnly: z.coerce.boolean().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating']).default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});

export type ExplorerFilterInput = z.infer<typeof explorerFilterSchema>;
