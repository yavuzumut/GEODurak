import { Injectable, Inject } from '@nestjs/common';
import { ILocationService, Coordinates } from './location.service.interface';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Station } from '../stations/station.entity';

@Injectable()
export class MockLocationService implements ILocationService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectRepository(Station) private readonly stationRepository: Repository<Station>
  ) {}

  async getLocation(driverId: string): Promise<Coordinates | null> {
    const data = await this.redis.get(`mock_loc:${driverId}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return { latitude: parsed.lat, longitude: parsed.lng };
  }

  async validateGeofence(driverId: string, stationId: string): Promise<boolean> {
    const mockLoc = await this.getLocation(driverId);
    if (!mockLoc) return false;

    // Use PostGIS to validate mock location against station geofence
    const point = {
      type: 'Point',
      coordinates: [mockLoc.longitude, mockLoc.latitude],
    };

    const result = await this.stationRepository.query(
      `SELECT ST_Contains(geofence, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) as "isInside"
       FROM stations WHERE id = $2`,
      [JSON.stringify(point), stationId]
    );

    return result?.[0]?.isInside || false;
  }
}
