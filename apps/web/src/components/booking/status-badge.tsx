import { Badge } from '@near-by/ui';

const STATUS_VARIANT: Record<string, 'gold' | 'success' | 'neutral' | 'danger' | 'burgundy'> = {
  REQUESTED: 'neutral',
  PENDING_PAYMENT: 'gold',
  PAYMENT_VERIFIED: 'gold',
  CONFIRMED: 'success',
  IN_PROGRESS: 'burgundy',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  REJECTED: 'danger',
  EXPIRED: 'danger',
  DISPUTED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested',
  PENDING_PAYMENT: 'Payment required',
  PAYMENT_VERIFIED: 'Payment verified',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  DISPUTED: 'Disputed',
};

export function BookingStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>{STATUS_LABEL[status] ?? status}</Badge>;
}
