import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { DriversService } from '../drivers/drivers.service';
export declare class TripsService {
    private tripsRepo;
    private driversService;
    constructor(tripsRepo: Repository<Trip>, driversService: DriversService);
    createTrip(data: Partial<Trip>): Promise<Trip>;
    findAll(): Promise<Trip[]>;
    findOne(id: string): Promise<Trip | null>;
    assignTrip(tripId: string, driverId: string): Promise<Trip | null>;
    acceptTrip(tripId: string): Promise<Trip | null>;
    completeTrip(tripId: string): Promise<Trip | null>;
    cancelTrip(tripId: string): Promise<Trip | null>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    getTodayTrips(): Promise<Trip[]>;
    getHourlyStats(): Promise<any[]>;
}
