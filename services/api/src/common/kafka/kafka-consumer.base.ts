import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Consumer } from 'kafkajs';
import { toDlq } from '@near-by/events';
import { KafkaProducerService } from './kafka-producer.service';

const MAX_RETRIES = 3;

/**
 * Base class for Kafka consumers: subscribes to a fixed topic list under a
 * consumer group, and on handler failure re-publishes the message with an
 * incremented retry counter header, moving it to `${topic}.dlq` once
 * MAX_RETRIES is exceeded so a bad message can't block the partition forever.
 */
export abstract class KafkaConsumerBase implements OnModuleInit, OnModuleDestroy {
  protected abstract readonly groupId: string;
  protected abstract readonly topics: string[];
  private consumer?: Consumer;
  private readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly kafkaProducer: KafkaProducerService) {}

  protected abstract handle(topic: string, payload: Record<string, unknown>): Promise<void>;

  async onModuleInit() {
    const kafka = this.kafkaProducer.getClient();
    this.consumer = kafka.consumer({ groupId: this.groupId });
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topics: this.topics, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          const raw = message.value?.toString('utf8');
          if (!raw) return;

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(raw);
          } catch {
            this.logger.error(`Dropping unparseable message on ${topic}`);
            return;
          }

          const retryCount = Number(message.headers?.['x-retry-count']?.toString() ?? '0');
          try {
            await this.handle(topic, payload);
          } catch (err) {
            if (retryCount < MAX_RETRIES) {
              this.logger.warn(`Handler failed for ${topic} (attempt ${retryCount + 1}) — retrying: ${(err as Error).message}`);
              await this.kafkaProducer.publishRaw(topic, payload, { 'x-retry-count': String(retryCount + 1) });
            } else {
              this.logger.error(`Handler failed for ${topic} after ${MAX_RETRIES} retries — sending to DLQ`);
              await this.kafkaProducer.publishRaw(toDlq(topic), payload, {
                'x-error': (err as Error).message,
                'x-original-topic': topic,
              });
            }
          }
        },
      });
      this.logger.log(`Consumer group "${this.groupId}" subscribed to [${this.topics.join(', ')}]`);
    } catch (err) {
      this.logger.warn(`Kafka consumer "${this.groupId}" could not start: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }
}
