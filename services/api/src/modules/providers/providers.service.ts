import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { StorageService } from '../../common/storage/storage.service';
import { TOPICS } from '@near-by/events';
import { slugify, randomSuffix } from './providers.util';
import type { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import type { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { CreatePricingDto } from './dto/create-pricing.dto';
import type { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import type { ExploreQueryDto } from './dto/explore-query.dto';

const PUBLIC_PROFILE_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  bio: true,
  city: true,
  state: true,
  country: true,
  languages: true,
  tags: true,
  coverImageKey: true,
  galleryImageKeys: true,
  availabilityStatus: true,
  identityVerification: true,
  ratingAverage: true,
  ratingCount: true,
  completedBookingsCount: true,
} satisfies Prisma.ProviderProfileSelect;

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
    private readonly storage: StorageService,
  ) {}

  private toPublicMedia<T extends { coverImageKey: string | null; galleryImageKeys: string[] }>(profile: T) {
    return {
      ...profile,
      coverImageUrl: profile.coverImageKey ? this.storage.getPublicUrl('MEDIA', profile.coverImageKey) : null,
      galleryImageUrls: profile.galleryImageKeys.map((k) => this.storage.getPublicUrl('MEDIA', k)),
    };
  }

  async createProfile(userId: string, dto: CreateProviderProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('A provider profile already exists for this account');
    }

    let slug = slugify(dto.displayName);
    while (await this.prisma.providerProfile.findUnique({ where: { slug } })) {
      slug = `${slugify(dto.displayName)}-${randomSuffix()}`;
    }

    return this.prisma.providerProfile.create({
      data: {
        userId,
        displayName: dto.displayName,
        slug,
        bio: dto.bio,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'IN',
        languages: dto.languages ?? [],
        tags: dto.tags ?? [],
      },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { services: true, pricing: true, availabilitySlots: { where: { status: 'OPEN' } } },
    });
    if (!profile) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return profile;
  }

  private async requireOwnProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Complete your provider profile first');
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerProfile.update({ where: { id: profile.id }, data: dto });
  }

  async updateAvailabilityStatus(userId: string, status: string) {
    const profile = await this.requireOwnProfile(userId);
    const updated = await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { availabilityStatus: status as never },
    });
    await this.kafka.publish(TOPICS.AVAILABILITY_UPDATED, {
      providerId: updated.id,
      availabilityStatus: updated.availabilityStatus,
      updatedAt: updated.updatedAt.toISOString(),
    });
    return updated;
  }

  async getUploadUrl(userId: string, contentType: string, kind: 'cover' | 'gallery') {
    const profile = await this.requireOwnProfile(userId);
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
    const ext = contentType.split('/')[1] ?? 'jpg';
    const key = `providers/${profile.id}/${kind}-${randomSuffix(8)}.${ext}`;
    return this.storage.getUploadUrl('MEDIA', key, contentType);
  }

  async setCoverImage(userId: string, key: string) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerProfile.update({ where: { id: profile.id }, data: { coverImageKey: key } });
  }

  async addGalleryImage(userId: string, key: string) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { galleryImageKeys: { push: key } },
    });
  }

  // ---- Services ----

  createService(userId: string, dto: CreateServiceDto) {
    return this.requireOwnProfile(userId).then((profile) =>
      this.prisma.providerService.create({ data: { providerId: profile.id, ...dto } }),
    );
  }

  async updateService(userId: string, serviceId: string, dto: Partial<CreateServiceDto>) {
    const profile = await this.requireOwnProfile(userId);
    const service = await this.prisma.providerService.findUnique({ where: { id: serviceId } });
    if (!service || service.providerId !== profile.id) {
      throw new NotFoundException('Service not found');
    }
    return this.prisma.providerService.update({ where: { id: serviceId }, data: dto });
  }

  async deleteService(userId: string, serviceId: string) {
    const profile = await this.requireOwnProfile(userId);
    const service = await this.prisma.providerService.findUnique({ where: { id: serviceId } });
    if (!service || service.providerId !== profile.id) {
      throw new NotFoundException('Service not found');
    }
    await this.prisma.providerService.delete({ where: { id: serviceId } });
  }

  // ---- Pricing ----

  async createPricing(userId: string, dto: CreatePricingDto) {
    const profile = await this.requireOwnProfile(userId);
    try {
      return await this.prisma.providerPricing.create({
        data: {
          providerId: profile.id,
          serviceId: dto.serviceId,
          durationMinutes: dto.durationMinutes,
          price: dto.price,
          currency: dto.currency ?? 'INR',
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A pricing tier for this service and duration already exists');
      }
      throw err;
    }
  }

  async updatePricing(userId: string, pricingId: string, newPrice: number) {
    const profile = await this.requireOwnProfile(userId);
    const pricing = await this.prisma.providerPricing.findUnique({ where: { id: pricingId } });
    if (!pricing || pricing.providerId !== profile.id) {
      throw new NotFoundException('Pricing tier not found');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.providerPricing.update({ where: { id: pricingId }, data: { price: newPrice } }),
      this.prisma.providerPricingHistory.create({
        data: {
          providerPricingId: pricingId,
          oldPrice: pricing.price,
          newPrice,
          changedBy: userId,
        },
      }),
    ]);

    await this.kafka.publish(TOPICS.PROVIDER_PRICE_UPDATED, {
      providerId: profile.id,
      providerPricingId: pricingId,
      oldPrice: Number(pricing.price),
      newPrice,
    });

    return updated;
  }

  async pricingHistory(userId: string, pricingId: string) {
    const profile = await this.requireOwnProfile(userId);
    const pricing = await this.prisma.providerPricing.findUnique({ where: { id: pricingId } });
    if (!pricing || pricing.providerId !== profile.id) {
      throw new NotFoundException('Pricing tier not found');
    }
    return this.prisma.providerPricingHistory.findMany({
      where: { providerPricingId: pricingId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async deletePricing(userId: string, pricingId: string) {
    const profile = await this.requireOwnProfile(userId);
    const pricing = await this.prisma.providerPricing.findUnique({ where: { id: pricingId } });
    if (!pricing || pricing.providerId !== profile.id) {
      throw new NotFoundException('Pricing tier not found');
    }
    await this.prisma.providerPricing.update({ where: { id: pricingId }, data: { isActive: false } });
  }

  // ---- Availability slots ----

  async createAvailabilitySlot(userId: string, dto: CreateAvailabilitySlotDto) {
    const profile = await this.requireOwnProfile(userId);
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }
    return this.prisma.providerAvailabilitySlot.create({
      data: { providerId: profile.id, startTime: start, endTime: end },
    });
  }

  async listMyAvailabilitySlots(userId: string) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerAvailabilitySlot.findMany({
      where: { providerId: profile.id, startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
    });
  }

  async deleteAvailabilitySlot(userId: string, slotId: string) {
    const profile = await this.requireOwnProfile(userId);
    const slot = await this.prisma.providerAvailabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.providerId !== profile.id) {
      throw new NotFoundException('Availability slot not found');
    }
    if (slot.status === 'BOOKED') {
      throw new ForbiddenException('Cannot remove a slot that is already booked');
    }
    await this.prisma.providerAvailabilitySlot.delete({ where: { id: slotId } });
  }

  // ---- Transportation preferences ----

  async getTransportPreference(userId: string) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerTransportPreference.upsert({
      where: { providerId: profile.id },
      update: {},
      create: { providerId: profile.id },
    });
  }

  async updateTransportPreference(userId: string, data: { usesTransport?: boolean; preferredVehicleType?: string; notes?: string }) {
    const profile = await this.requireOwnProfile(userId);
    return this.prisma.providerTransportPreference.upsert({
      where: { providerId: profile.id },
      update: data,
      create: { providerId: profile.id, ...data },
    });
  }

  // ---- Public marketplace ----

  async explore(query: ExploreQueryDto) {
    const where: Prisma.ProviderProfileWhereInput = {
      isActive: true,
      deletedAt: null,
    };
    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    if (query.availableOnly) {
      where.availabilityStatus = { in: ['AVAILABLE_NOW', 'AVAILABLE_LATER'] };
    }
    if (query.verifiedOnly) {
      where.identityVerification = 'VERIFIED';
    }
    if (query.minRating !== undefined) {
      where.ratingAverage = { gte: query.minRating };
    }

    const profiles = await this.prisma.providerProfile.findMany({
      where,
      select: {
        ...PUBLIC_PROFILE_SELECT,
        pricing: {
          where: {
            isActive: true,
            ...(query.durationMinutes ? { durationMinutes: query.durationMinutes } : {}),
          },
          select: { price: true, durationMinutes: true },
        },
      },
    });

    let cards = profiles
      .filter((p) => p.pricing.length > 0)
      .map((p) => {
        const prices = p.pricing.map((tier) => Number(tier.price));
        const startingPrice = Math.min(...prices);
        const { pricing, ...rest } = p;
        return { ...this.toPublicMedia(rest), startingPrice };
      });

    if (query.minPrice !== undefined) {
      cards = cards.filter((c) => c.startingPrice >= query.minPrice!);
    }
    if (query.maxPrice !== undefined) {
      cards = cards.filter((c) => c.startingPrice <= query.maxPrice!);
    }

    const sortBy = query.sortBy ?? 'relevance';
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.startingPrice - b.startingPrice;
        case 'price_desc':
          return b.startingPrice - a.startingPrice;
        case 'rating':
          return Number(b.ratingAverage) - Number(a.ratingAverage);
        default:
          return (
            Number(b.ratingAverage) * 10 + b.completedBookingsCount -
            (Number(a.ratingAverage) * 10 + a.completedBookingsCount)
          );
      }
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const total = cards.length;
    const paged = cards.slice((page - 1) * pageSize, page * pageSize);

    return { items: paged, total, page, pageSize };
  }

  async getPublicProfile(slug: string) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: {
        ...PUBLIC_PROFILE_SELECT,
        services: { where: { isActive: true }, select: { id: true, name: true, description: true } },
        pricing: {
          where: { isActive: true },
          select: { id: true, serviceId: true, durationMinutes: true, price: true, currency: true },
        },
        availabilitySlots: {
          where: { status: 'OPEN', startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 20,
          select: { id: true, startTime: true, endTime: true },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('Provider not found');
    }

    const healthVerification = await this.prisma.verificationRequest.findFirst({
      where: { provider: { slug }, type: 'HEALTH', status: 'APPROVED' },
      orderBy: { verifiedAt: 'desc' },
      select: { verifiedAt: true, expiresAt: true },
    });

    return {
      ...this.toPublicMedia(profile),
      healthVerification: healthVerification
        ? { verified: true, verifiedOn: healthVerification.verifiedAt }
        : { verified: false },
    };
  }
}
