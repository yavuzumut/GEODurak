import { Controller, Post, Body, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Controller('driver')
export class HeartbeatController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Post('heartbeat')
  async heartbeat(@Body() body: { driverId: string }) {
    if (!body.driverId) return { success: false };

    // Set TTL to 60 seconds. If no heartbeat received in 60s, it expires.
    await this.redis.set(`heartbeat:${body.driverId}`, Date.now().toString(), 'EX', 60);

    return { success: true };
  }
}
