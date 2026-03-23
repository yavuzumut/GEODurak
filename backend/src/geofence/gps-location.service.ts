import { Injectable } from '@nestjs/common';
import { ILocationService, Coordinates } from './location.service.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';

@Injectable()
export class GPSLocationService implements ILocationService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepository: Repository<Driver>,
  ) {}

  async getLocation(driverId: string): Promise<Coordinates | null> {
    const driver = await this.driversRepository.findOne({ where: { id: driverId } });
    if (!driver || !driver.location) return null;
    return {
      longitude: driver.location.coordinates[0],
      latitude: driver.location.coordinates[1],
    };
  }

  async validateGeofence(driverId: string, stationId: string): Promise<boolean> {
    // Validate the driver's current PostgreSQL location against the station's geofence
    const result = await this.driversRepository.query(
      `SELECT ST_Contains(s.geofence, d.location) as "isInside"
       FROM drivers d, stations s 
       WHERE d.id = $1 AND s.id = $2`,
      [driverId, stationId]
    );
    return result?.[0]?.isInside || false;
  }
}
