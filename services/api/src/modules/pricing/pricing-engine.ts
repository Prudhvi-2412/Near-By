import type { PricingRule } from '@prisma/client';

export interface DemandInputs {
  recentBookingsCount: number;
  availableProvidersCount: number;
  now: Date;
}

export interface DemandResult {
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  multiplier: number;
  reasoning: string;
}

const WEEKDAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Pure, unit-testable pricing heuristic. Produces a *suggestion* only — the
 * caller decides whether to persist it, and the provider decides whether to
 * accept it. Never mutates ProviderPricing directly.
 */
export function computeDemandSuggestion(inputs: DemandInputs, rules: PricingRule[]): DemandResult {
  const supply = Math.max(inputs.availableProvidersCount, 1);
  const demandRatio = inputs.recentBookingsCount / supply;

  let demandLevel: DemandResult['demandLevel'] = 'LOW';
  if (demandRatio >= 2) demandLevel = 'HIGH';
  else if (demandRatio >= 1) demandLevel = 'MEDIUM';

  const demandRule = rules.find((r) => r.ruleType === 'DEMAND_MULTIPLIER');
  const timeRule = rules.find((r) => r.ruleType === 'TIME_OF_DAY');

  let multiplier = 1;
  const reasons: string[] = [
    `${inputs.recentBookingsCount} booking(s) in this city over the last 24h against ${inputs.availableProvidersCount} available provider(s) (${demandLevel.toLowerCase()} demand).`,
  ];

  if (demandRule) {
    const config = demandRule.config as { multiplier: number; lowSupplyThreshold: number };
    if (demandLevel === 'HIGH') {
      multiplier *= config.multiplier;
      reasons.push(`Demand multiplier applied (+${Math.round((config.multiplier - 1) * 100)}%).`);
    } else if (demandLevel === 'MEDIUM') {
      const halfEffect = 1 + (config.multiplier - 1) / 2;
      multiplier *= halfEffect;
      reasons.push(`Partial demand multiplier applied (+${Math.round((halfEffect - 1) * 100)}%).`);
    }
  }

  if (timeRule) {
    const config = timeRule.config as { days: string[]; startHour: number; endHour: number; multiplier: number };
    const dayCode = WEEKDAY_CODES[inputs.now.getDay()];
    const hour = inputs.now.getHours();
    if (config.days.includes(dayCode) && hour >= config.startHour && hour < config.endHour) {
      multiplier *= config.multiplier;
      reasons.push(`Weekend evening time-of-day boost applied (+${Math.round((config.multiplier - 1) * 100)}%).`);
    }
  }

  return { demandLevel, multiplier, reasoning: reasons.join(' ') };
}
