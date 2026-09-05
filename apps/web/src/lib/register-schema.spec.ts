import { describe, expect, it } from 'vitest';
import { registerSchema } from '@near-by/types';

const validPayload = {
  email: 'new.user@example.com',
  password: 'Password1',
  confirmPassword: 'Password1',
  role: 'CUSTOMER' as const,
  ageConfirmed: true as const,
  termsAccepted: true as const,
};

describe('registerSchema', () => {
  it('accepts a valid payload', () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...validPayload, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password without an uppercase letter or number', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'lowercase', confirmPassword: 'lowercase' });
    expect(result.success).toBe(false);
  });

  it('rejects registration when age is not confirmed', () => {
    const result = registerSchema.safeParse({ ...validPayload, ageConfirmed: false });
    expect(result.success).toBe(false);
  });

  it('rejects registration when terms are not accepted', () => {
    const result = registerSchema.safeParse({ ...validPayload, termsAccepted: false });
    expect(result.success).toBe(false);
  });
});
