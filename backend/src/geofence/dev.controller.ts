import { Controller, Post, Body, Get, Param, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Controller('v1/dev')
export class DevController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Post('mock-location')
  async setMockLocation(@Body() body: { driverId: string; lat: number; lng: number; speed?: number; heading?: number }) {
    if (process.env.NODE_ENV === 'production' || process.env.TEST_MODE !== 'true') {
      return { success: false, message: 'Test mode is disabled.' };
    }

    const { driverId, lat, lng, speed, heading } = body;
    const payload = JSON.stringify({ lat, lng, speed, heading, updatedAt: new Date().toISOString() });
    
    // Save to Redis with 30 min (1800s) TTL
    await this.redis.set(`mock_loc:${driverId}`, payload, 'EX', 1800);

    return { success: true, message: `Mock location set for driver ${driverId}` };
  }
}
