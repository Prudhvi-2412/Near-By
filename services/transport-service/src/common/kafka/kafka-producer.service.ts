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
      clientId: 'near-by-transport-service',
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
      this.logger.warn(`Kafka producer could not connect (${(err as Error).message})`);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }

  async publish<T extends Record<string, unknown>>(topic: TopicName | string, payload: T) {
    const envelope = { eventId: randomUUID(), occurredAt: new Date().toISOString(), source: 'near-by-transport-service', ...payload };
    if (!this.connected) {
      this.logger.warn(`Kafka not connected — skipping publish to ${topic}`);
      return;
    }
    try {
      await this.producer.send({ topic, messages: [{ value: JSON.stringify(envelope) }] });
    } catch (err) {
      this.logger.error(`Failed to publish to ${topic}: ${(err as Error).message}`);
    }
  }
}
