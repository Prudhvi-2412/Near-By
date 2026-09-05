import { computeDemandSuggestion } from './pricing-engine';
import type { PricingRule } from '@prisma/client';

function rule(overrides: Partial<PricingRule>): PricingRule {
  return {
    id: 'rule-1',
    name: 'test rule',
    description: null,
    ruleType: 'DEMAND_MULTIPLIER',
    config: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PricingRule;
}

const DEMAND_RULE = rule({
  ruleType: 'DEMAND_MULTIPLIER',
  config: { multiplier: 1.2, lowSupplyThreshold: 2 },
});

describe('computeDemandSuggestion', () => {
  it('classifies low demand when bookings are well below supply', () => {
    const result = computeDemandSuggestion(
      { recentBookingsCount: 1, availableProvidersCount: 10, now: new Date('2026-01-05T10:00:00') },
      [DEMAND_RULE],
    );
    expect(result.demandLevel).toBe('LOW');
    expect(result.multiplier).toBe(1);
  });

  it('classifies medium demand and applies half the multiplier effect', () => {
    const result = computeDemandSuggestion(
      { recentBookingsCount: 5, availableProvidersCount: 5, now: new Date('2026-01-05T10:00:00') },
      [DEMAND_RULE],
    );
    expect(result.demandLevel).toBe('MEDIUM');
    expect(result.multiplier).toBeCloseTo(1.1, 5);
  });

  it('classifies high demand and applies the full multiplier', () => {
    const result = computeDemandSuggestion(
      { recentBookingsCount: 10, availableProvidersCount: 5, now: new Date('2026-01-05T10:00:00') },
      [DEMAND_RULE],
    );
    expect(result.demandLevel).toBe('HIGH');
    expect(result.multiplier).toBeCloseTo(1.2, 5);
  });

  it('treats zero available providers as a supply of one to avoid divide-by-zero', () => {
    const result = computeDemandSuggestion(
      { recentBookingsCount: 3, availableProvidersCount: 0, now: new Date('2026-01-05T10:00:00') },
      [DEMAND_RULE],
    );
    expect(result.demandLevel).toBe('HIGH');
    expect(Number.isFinite(result.multiplier)).toBe(true);
  });

  it('stacks the time-of-day rule on top of the demand multiplier on a Friday evening', () => {
    const timeRule = rule({
      ruleType: 'TIME_OF_DAY',
      config: { days: ['FRI', 'SAT'], startHour: 18, endHour: 23, multiplier: 1.1 },
    });
    // 2026-01-02 is a Friday.
    const fridayEvening = new Date('2026-01-02T20:00:00');
    const result = computeDemandSuggestion(
      { recentBookingsCount: 10, availableProvidersCount: 5, now: fridayEvening },
      [DEMAND_RULE, timeRule],
    );
    expect(result.multiplier).toBeCloseTo(1.2 * 1.1, 5);
  });

  it('does not apply the time-of-day rule outside the configured window', () => {
    const timeRule = rule({
      ruleType: 'TIME_OF_DAY',
      config: { days: ['FRI', 'SAT'], startHour: 18, endHour: 23, multiplier: 1.1 },
    });
    const mondayAfternoon = new Date('2026-01-05T14:00:00');
    const result = computeDemandSuggestion(
      { recentBookingsCount: 10, availableProvidersCount: 5, now: mondayAfternoon },
      [DEMAND_RULE, timeRule],
    );
    expect(result.multiplier).toBeCloseTo(1.2, 5);
  });

  it('never lowers the price — inactive/absent rules leave the multiplier at 1', () => {
    const result = computeDemandSuggestion(
      { recentBookingsCount: 0, availableProvidersCount: 5, now: new Date() },
      [],
    );
    expect(result.multiplier).toBe(1);
  });
});
