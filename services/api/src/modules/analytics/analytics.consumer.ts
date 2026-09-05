import { Injectable } from '@nestjs/common';
import { CONSUMER_GROUPS, TOPICS } from '@near-by/events';
import { KafkaConsumerBase } from '../../common/kafka/kafka-consumer.base';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsConsumer extends KafkaConsumerBase {
  protected readonly groupId = CONSUMER_GROUPS.ANALYTICS;
  protected readonly topics = [
    TOPICS.BOOKING_CREATED,
    TOPICS.BOOKING_COMPLETED,
    TOPICS.PAYMENT_VERIFIED,
    TOPICS.RATING_SUBMITTED,
  ];

  constructor(kafkaProducer: KafkaProducerService, private readonly analytics: AnalyticsService) {
    super(kafkaProducer);
  }

  protected async handle(topic: string, payload: Record<string, unknown>) {
    switch (topic) {
      case TOPICS.BOOKING_CREATED:
        await this.analytics.incrementCounter('bookings_created');
        break;
      case TOPICS.BOOKING_COMPLETED:
        await this.analytics.incrementCounter('bookings_completed');
        break;
      case TOPICS.PAYMENT_VERIFIED:
        await this.analytics.incrementCounter('payments_verified');
        await this.analytics.incrementAmount('revenue', Number(payload.amount ?? 0));
        break;
      case TOPICS.RATING_SUBMITTED:
        await this.analytics.incrementCounter('ratings_submitted');
        break;
    }
  }
}
