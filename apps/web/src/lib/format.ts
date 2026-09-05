export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE_NOW: 'Available now',
  AVAILABLE_LATER: 'Available later',
  BUSY: 'Busy',
  UNAVAILABLE: 'Unavailable',
};
