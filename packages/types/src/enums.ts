// Mirrors the enums defined in prisma/schema.prisma. Kept independent of
// @prisma/client so this package stays lightweight enough for the browser bundle.

export const ROLE_NAMES = ['CUSTOMER', 'PROVIDER', 'ADMIN'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const AVAILABILITY_STATUSES = ['AVAILABLE_NOW', 'AVAILABLE_LATER', 'BUSY', 'UNAVAILABLE'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const BOOKING_STATUSES = [
  'REQUESTED',
  'PENDING_PAYMENT',
  'PAYMENT_VERIFIED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'DISPUTED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DEMAND_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type DemandLevel = (typeof DEMAND_LEVELS)[number];

export const IDENTITY_VERIFICATION_STATUSES = ['NONE', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type IdentityVerificationStatus = (typeof IDENTITY_VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_TYPES = ['IDENTITY', 'HEALTH'] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const REVIEW_TARGET_TYPES = ['PROVIDER', 'CUSTOMER'] as const;
export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

export const TRANSPORT_REQUEST_STATUSES = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TransportRequestStatus = (typeof TRANSPORT_REQUEST_STATUSES)[number];

export const ACCOMMODATION_BOOKING_STATUSES = ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
export type AccommodationBookingStatus = (typeof ACCOMMODATION_BOOKING_STATUSES)[number];

export const DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL', 'SMS'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
