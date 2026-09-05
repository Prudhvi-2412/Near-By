import { BadRequestException } from '@nestjs/common';
import { assertTransition } from './booking-state-machine';

describe('assertTransition', () => {
  it('allows the full happy-path lifecycle', () => {
    expect(() => assertTransition('REQUESTED', 'PENDING_PAYMENT')).not.toThrow();
    expect(() => assertTransition('PENDING_PAYMENT', 'PAYMENT_VERIFIED')).not.toThrow();
    expect(() => assertTransition('PAYMENT_VERIFIED', 'CONFIRMED')).not.toThrow();
    expect(() => assertTransition('CONFIRMED', 'IN_PROGRESS')).not.toThrow();
    expect(() => assertTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
  });

  it('allows cancellation from REQUESTED, PENDING_PAYMENT and CONFIRMED', () => {
    expect(() => assertTransition('REQUESTED', 'CANCELLED')).not.toThrow();
    expect(() => assertTransition('PENDING_PAYMENT', 'CANCELLED')).not.toThrow();
    expect(() => assertTransition('CONFIRMED', 'CANCELLED')).not.toThrow();
  });

  it('rejects skipping straight from REQUESTED to CONFIRMED', () => {
    expect(() => assertTransition('REQUESTED', 'CONFIRMED')).toThrow(BadRequestException);
  });

  it('rejects any transition out of terminal states', () => {
    expect(() => assertTransition('COMPLETED', 'CONFIRMED')).toThrow(BadRequestException);
    expect(() => assertTransition('CANCELLED', 'CONFIRMED')).toThrow(BadRequestException);
    expect(() => assertTransition('REJECTED', 'PENDING_PAYMENT')).toThrow(BadRequestException);
    expect(() => assertTransition('EXPIRED', 'REQUESTED')).toThrow(BadRequestException);
  });

  it('rejects moving backwards in the lifecycle', () => {
    expect(() => assertTransition('CONFIRMED', 'PENDING_PAYMENT')).toThrow(BadRequestException);
    expect(() => assertTransition('IN_PROGRESS', 'CONFIRMED')).toThrow(BadRequestException);
  });

  it('allows a dispute to be raised from CONFIRMED, IN_PROGRESS or COMPLETED and resolved either way', () => {
    expect(() => assertTransition('CONFIRMED', 'DISPUTED')).not.toThrow();
    expect(() => assertTransition('IN_PROGRESS', 'DISPUTED')).not.toThrow();
    expect(() => assertTransition('COMPLETED', 'DISPUTED')).not.toThrow();
    expect(() => assertTransition('DISPUTED', 'COMPLETED')).not.toThrow();
    expect(() => assertTransition('DISPUTED', 'CANCELLED')).not.toThrow();
  });

  it('rejects disputing a booking that never reached CONFIRMED', () => {
    expect(() => assertTransition('REQUESTED', 'DISPUTED')).toThrow(BadRequestException);
    expect(() => assertTransition('PENDING_PAYMENT', 'DISPUTED')).toThrow(BadRequestException);
  });
});
