import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { computeDemandSuggestion } from './pricing-engine';

const MIN_MEANINGFUL_CHANGE = 0.03; // ignore <3% suggestions — not worth surfacing

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
  ) {}

  private async generateForProviderProfile(providerId: string) {
    const provider = await this.prisma.providerProfile.findUniqueOrThrow({ where: { id: providerId } });
    const rules = await this.prisma.pricingRule.findMany({ where: { isActive: true } });

    const since = new Date(Date.now() - 24 * 60 * 60_000);
    const [recentBookingsCount, availableProvidersCount, pricingTiers] = await Promise.all([
      this.prisma.booking.count({
        where: { city: provider.city, createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REJECTED', 'EXPIRED'] } },
      }),
      this.prisma.providerProfile.count({
        where: { city: provider.city, isActive: true, availabilityStatus: { in: ['AVAILABLE_NOW', 'AVAILABLE_LATER'] } },
      }),
      this.prisma.providerPricing.findMany({ where: { providerId, isActive: true } }),
    ]);

    const { demandLevel, multiplier, reasoning } = computeDemandSuggestion(
      { recentBookingsCount, availableProvidersCount, now: new Date() },
      rules,
    );

    if (Math.abs(multiplier - 1) < MIN_MEANINGFUL_CHANGE) {
      return [];
    }

    const created = [];
    for (const tier of pricingTiers) {
      const currentPrice = Number(tier.price);
      const suggestedPrice = Math.round((currentPrice * multiplier) / 10) * 10;
      if (suggestedPrice === currentPrice) continue;

      const existingPending = await this.prisma.pricingSuggestion.findFirst({
        where: { providerPricingId: tier.id, status: 'PENDING' },
      });
      if (existingPending) continue;

      const suggestion = await this.prisma.pricingSuggestion.create({
        data: {
          providerId,
          providerPricingId: tier.id,
          currentPrice,
          suggestedPrice,
          demandLevel,
          availableProvidersCount,
          reasoning,
        },
      });
      created.push(suggestion);
    }
    return created;
  }

  async generateForOwnProvider(userId: string) {
    const provider = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return this.generateForProviderProfile(provider.id);
  }

  async generateForAllActiveProviders() {
    const providers = await this.prisma.providerProfile.findMany({
      where: { isActive: true, availabilityStatus: { in: ['AVAILABLE_NOW', 'AVAILABLE_LATER'] } },
      select: { id: true },
    });
    let total = 0;
    for (const p of providers) {
      const created = await this.generateForProviderProfile(p.id);
      total += created.length;
    }
    if (total > 0) this.logger.log(`Generated ${total} pricing suggestion(s) across ${providers.length} provider(s)`);
    return total;
  }

  async listPendingForOwnProvider(userId: string) {
    const provider = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return this.prisma.pricingSuggestion.findMany({
      where: { providerId: provider.id, status: 'PENDING' },
      include: { pricing: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireOwnSuggestion(userId: string, suggestionId: string) {
    const suggestion = await this.prisma.pricingSuggestion.findUnique({
      where: { id: suggestionId },
      include: { provider: true },
    });
    if (!suggestion) {
      throw new NotFoundException('Pricing suggestion not found');
    }
    if (suggestion.provider.userId !== userId) {
      throw new ForbiddenException('This suggestion does not belong to you');
    }
    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException('This suggestion has already been responded to');
    }
    return suggestion;
  }

  async accept(userId: string, suggestionId: string) {
    const suggestion = await this.requireOwnSuggestion(userId, suggestionId);
    await this.providersService.updatePricing(userId, suggestion.providerPricingId, Number(suggestion.suggestedPrice));
    return this.prisma.pricingSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
  }

  async reject(userId: string, suggestionId: string) {
    await this.requireOwnSuggestion(userId, suggestionId);
    return this.prisma.pricingSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });
  }

  listRules() {
    return this.prisma.pricingRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createRule(data: { name: string; description?: string; ruleType: 'DEMAND_MULTIPLIER' | 'TIME_OF_DAY' | 'SUPPLY_SHORTAGE'; config: Record<string, unknown> }) {
    return this.prisma.pricingRule.create({ data: { ...data, config: data.config as Prisma.InputJsonValue } });
  }

  async setRuleActive(id: string, isActive: boolean) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Pricing rule not found');
    }
    return this.prisma.pricingRule.update({ where: { id }, data: { isActive } });
  }
}
