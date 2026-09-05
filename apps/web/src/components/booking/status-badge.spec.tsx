import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookingStatusBadge } from './status-badge';

describe('BookingStatusBadge', () => {
  it('renders a human-readable label for a known status', () => {
    render(<BookingStatusBadge status="PENDING_PAYMENT" />);
    expect(screen.getByText('Payment required')).toBeInTheDocument();
  });

  it('falls back to the raw status string for an unknown value', () => {
    render(<BookingStatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });
});
