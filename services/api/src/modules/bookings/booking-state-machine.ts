import { BadRequestException } from '@nestjs/common';
import type { BookingStatus } from '@prisma/client';

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ['PENDING_PAYMENT', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PENDING_PAYMENT: ['PAYMENT_VERIFIED', 'CANCELLED', 'EXPIRED'],
  PAYMENT_VERIFIED: ['CONFIRMED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(`Cannot move a booking from ${from} to ${to}`);
  }
}
