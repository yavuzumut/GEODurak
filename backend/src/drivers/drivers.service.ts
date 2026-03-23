import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async create(driverData: Partial<Driver>): Promise<Driver> {
    const driver = this.driversRepository.create(driverData);
    return this.driversRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return this.driversRepository.find();
  }

  async findOne(id: string): Promise<Driver | null> {
    return this.driversRepository.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<Driver | null> {
    return this.driversRepository.findOne({ where: { phone } });
  }

  async updateLocation(driverId: string, latitude: number, longitude: number, stationId?: string): Promise<Driver | null> {
    const point = {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON uses longitude first
    };

    const driverInfo = await this.driversRepository.findOne({ where: { id: driverId } });
    if (!driverInfo) return null;

    const currentStationId = stationId || driverInfo.stationId;

    if (currentStationId) {
      await this.driversRepository.query(
        `UPDATE drivers SET 
          location = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          "isInsideGeofence" = (
            SELECT ST_Contains(s.geofence, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
            FROM stations s WHERE s.id = $2
          ),
          "stationId" = $2
         WHERE id = $3`,
        [JSON.stringify(point), currentStationId, driverId],
      );
    } else {
      await this.driversRepository.query(
        `UPDATE drivers SET 
          location = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
         WHERE id = $2`,
        [JSON.stringify(point), driverId],
      );
    }

    // Track geofence exit time
    const driver = await this.driversRepository.findOne({ where: { id: driverId } });
    if (driver && !driver.isInsideGeofence && !driver.lastGeofenceExitAt) {
      await this.driversRepository.update(driverId, { lastGeofenceExitAt: new Date() });
      driver.lastGeofenceExitAt = new Date();
    } else if (driver && driver.isInsideGeofence && driver.lastGeofenceExitAt) {
      // Came back inside, reset the exit timer
      await this.driversRepository.update(driverId, { lastGeofenceExitAt: null as any });
      driver.lastGeofenceExitAt = null as any;
    }

    return driver;
  }

  async updateStatus(driverId: string, status: DriverStatus): Promise<Driver | null> {
    await this.driversRepository.update(driverId, { status });
    return this.driversRepository.findOne({ where: { id: driverId } });
  }

  async clearGeofenceExitTimer(driverId: string): Promise<void> {
    await this.driversRepository.update(driverId, { lastGeofenceExitAt: null as any });
  }

  async getDriversOutsideGeofenceTooLong(timeoutMs: number): Promise<Driver[]> {
    const cutoff = new Date(Date.now() - timeoutMs);
    return this.driversRepository
      .createQueryBuilder('driver')
      .where('"isInsideGeofence" = false')
      .andWhere('"lastGeofenceExitAt" IS NOT NULL')
      .andWhere('"lastGeofenceExitAt" <= :cutoff', { cutoff })
      .andWhere('driver.status != :offline', { offline: DriverStatus.OFFLINE })
      .getMany();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    await this.driversRepository.delete(id);
    return { deleted: true };
  }

  async getAllWithCoordinates(): Promise<any[]> {
    return this.driversRepository.query(`
      SELECT 
        id, name, "licensePlate", phone, status, 
        "isInsideGeofence", "joinedQueueAt", "stationId",
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
      FROM drivers
      WHERE location IS NOT NULL
    `);
  }
}
