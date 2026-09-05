import { Injectable } from '@nestjs/common';
import { CONSUMER_GROUPS, TOPICS, notificationRequestedPayload } from '@near-by/events';
import { KafkaConsumerBase } from '../../common/kafka/kafka-consumer.base';
import { KafkaProducerService } from '../../common/kafka/kafka-producer.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsConsumer extends KafkaConsumerBase {
  protected readonly groupId = CONSUMER_GROUPS.NOTIFICATIONS;
  protected readonly topics = [TOPICS.NOTIFICATION_REQUESTED];

  constructor(kafkaProducer: KafkaProducerService, private readonly notifications: NotificationsService) {
    super(kafkaProducer);
  }

  protected async handle(_topic: string, payload: Record<string, unknown>) {
    const parsed = notificationRequestedPayload.parse(payload);
    await this.notifications.deliver(parsed);
  }
}
