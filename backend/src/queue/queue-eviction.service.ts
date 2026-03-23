import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import Redis from 'ioredis';

@Injectable()
export class QueueEvictionService implements OnModuleInit {
  private readonly logger = new Logger(QueueEvictionService.name);
  private subscriber: Redis;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly queueGateway: QueueGateway,
  ) {
    // We need a separate connection for subscribing
    this.subscriber = new Redis({ host: 'localhost', port: 6379 });
  }

  async onModuleInit() {
    try {
      // Enable keyspace events for expirations
      await this.redis.config('SET', 'notify-keyspace-events', 'Ex');

      this.subscriber.subscribe('__keyevent@0__:expired', (err) => {
        if (err) this.logger.error('Failed to subscribe to Redis expired events', err);
      });

      this.subscriber.on('message', (channel, message) => {
        if (channel === '__keyevent@0__:expired' && message.startsWith('heartbeat:')) {
          const driverId = message.split(':')[1];
          this.logger.warn(`Heartbeat expired for driver ${driverId}. Evicting from queue.`);
          this.queueGateway.evictDriver(driverId);
        }
      });
      console.log('Redis Eviction Policy (Heartbeat) listener started.');
    } catch (e) {
      this.logger.error('Failed to initialize Redis Eviction Policy.', e);
    }
  }
}
