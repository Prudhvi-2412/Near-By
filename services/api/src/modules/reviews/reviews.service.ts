import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { TOPICS } from '@near-by/events';
import { Prisma } from '@prisma/client';
import type { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { provider: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review completed bookings');
    }

    const isCustomer = booking.customerId === authorId;
    const isProvider = booking.provider.userId === authorId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You were not part of this booking');
    }

    const targetType = isCustomer ? 'PROVIDER' : 'CUSTOMER';
    const targetId = isCustomer ? booking.provider.userId : booking.customerId;

    let review;
    try {
      review = await this.prisma.review.create({
        data: {
          bookingId: booking.id,
          authorId,
          targetId,
          targetType,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You have already reviewed this booking');
      }
      throw err;
    }

    if (targetType === 'PROVIDER') {
      const agg = await this.prisma.review.aggregate({
        where: { targetId, targetType: 'PROVIDER', status: 'PUBLISHED' },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.providerProfile.update({
        where: { id: booking.providerId },
        data: { ratingAverage: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
      });
    }

    await this.kafka.publish(TOPICS.RATING_SUBMITTED, {
      reviewId: review.id,
      bookingId: booking.id,
      targetId,
      targetType,
      rating: dto.rating,
    });

    return review;
  }

  listForTarget(targetId: string) {
    return this.prisma.review.findMany({
      where: { targetId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, email: true } } },
    });
  }

  async report(reporterId: string, reviewId: string, reason: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return this.prisma.reviewReport.create({ data: { reviewId, reportedById: reporterId, reason } });
  }
}
