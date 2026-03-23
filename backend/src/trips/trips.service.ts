import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from './trip.entity';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepo: Repository<Trip>,
    private driversService: DriversService,
  ) {}

  async createTrip(data: Partial<Trip>): Promise<Trip> {
    const trip = this.tripsRepo.create({ ...data, status: TripStatus.PENDING });
    return this.tripsRepo.save(trip);
  }

  async findAll(): Promise<Trip[]> {
    return this.tripsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Trip | null> {
    return this.tripsRepo.findOne({ where: { id } });
  }

  async assignTrip(tripId: string, driverId: string): Promise<Trip | null> {
    await this.tripsRepo.update(tripId, {
      driverId,
      status: TripStatus.ASSIGNED,
      assignedAt: new Date(),
    });
    return this.tripsRepo.findOne({ where: { id: tripId } });
  }

  async acceptTrip(tripId: string): Promise<Trip | null> {
    await this.tripsRepo.update(tripId, {
      status: TripStatus.ACCEPTED,
      acceptedAt: new Date(),
    });
    return this.tripsRepo.findOne({ where: { id: tripId } });
  }

  async completeTrip(tripId: string): Promise<Trip | null> {
    await this.tripsRepo.update(tripId, {
      status: TripStatus.COMPLETED,
      completedAt: new Date(),
    });
    return this.tripsRepo.findOne({ where: { id: tripId } });
  }

  async cancelTrip(tripId: string): Promise<Trip | null> {
    await this.tripsRepo.update(tripId, {
      status: TripStatus.CANCELLED,
    });
    return this.tripsRepo.findOne({ where: { id: tripId } });
  }

  async getTodayTrips(): Promise<Trip[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tripsRepo
      .createQueryBuilder('trip')
      .where('trip.createdAt >= :today', { today })
      .orderBy('trip.createdAt', 'DESC')
      .getMany();
  }

  async getHourlyStats(): Promise<any[]> {
    return this.tripsRepo.query(`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
      FROM trips
      WHERE "createdAt" >= CURRENT_DATE
      GROUP BY hour
      ORDER BY hour
    `);
  }
}
