import { describe, expect, it } from 'vitest';
import { formatINR } from './format';

describe('formatINR', () => {
  it('formats whole rupee amounts with the ₹ symbol and no decimals', () => {
    expect(formatINR(2500)).toBe('₹2,500');
  });

  it('uses Indian digit grouping for large numbers', () => {
    expect(formatINR(1234567)).toBe('₹12,34,567');
  });

  it('rounds fractional paise to the nearest rupee', () => {
    expect(formatINR(999.6)).toBe('₹1,000');
  });

  it('formats zero without throwing', () => {
    expect(formatINR(0)).toBe('₹0');
  });
});
