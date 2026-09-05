import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { REDIS_CLIENT } from './redis.constants';

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) public readonly client: Redis) {}

  /**
   * Acquire a short-lived distributed lock. Used to serialize booking creation
   * against a single availability slot / provider-pricing tier so two customers
   * can't both win the same slot under concurrent requests.
   */
  async acquireLock(key: string, ttlMs = 10_000): Promise<string | null> {
    const token = randomUUID();
    const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    await this.client.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
  }

  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 10_000): Promise<T> {
    const token = await this.acquireLock(key, ttlMs);
    if (!token) {
      throw new Error(`LOCK_CONTENDED:${key}`);
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(key, token);
    }
  }
}
