export interface BookingItem {
  id: string;
  label: string;
  durationMinutes: number;
  unitPrice: string | number;
  quantity: number;
  subtotal: string | number;
}

export interface BookingStatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface BookingSummary {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  city: string;
  totalAmount: string | number;
  currency: string;
  provider?: { displayName: string; slug?: string };
  customer?: { email: string };
  items: BookingItem[];
}

export interface BookingDetail extends BookingSummary {
  meetingNotes: string | null;
  cancellationReason: string | null;
  statusHistory: BookingStatusHistoryEntry[];
  payments: { id: string; status: string; provider: string; amount: string | number }[];
}
