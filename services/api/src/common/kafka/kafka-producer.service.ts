import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { randomUUID } from 'crypto';
import type { TopicName } from '@near-by/events';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor(private readonly config: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.config.get<string>('KAFKA_CLIENT_ID') ?? 'near-by-api',
      brokers: (this.config.get<string>('KAFKA_BROKERS') ?? 'localhost:9092').split(','),
      retry: { retries: 5 },
    });
    this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Kafka producer could not connect (${(err as Error).message}) — events will be dropped until it reconnects`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.producer.disconnect();
    }
  }

  /** Publishes an envelope of {eventId, occurredAt, source, ...payload} to the given topic. */
  async publish<T extends Record<string, unknown>>(topic: TopicName | string, payload: T, key?: string) {
    const envelope = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      source: 'near-by-api',
      ...payload,
    };

    if (!this.connected) {
      this.logger.warn(`Kafka not connected — skipping publish to ${topic}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(envelope) }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish to ${topic}: ${(err as Error).message}`);
    }
  }

  /** Publishes a payload verbatim (no envelope stamping) — used for consumer retry/DLQ re-publishing. */
  async publishRaw(topic: string, payload: unknown, headers?: Record<string, string>) {
    if (!this.connected) {
      this.logger.warn(`Kafka not connected — skipping publish to ${topic}`);
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload), headers }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish to ${topic}: ${(err as Error).message}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClient(): Kafka {
    return this.kafka;
  }
}
