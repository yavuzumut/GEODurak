import { ILocationService, Coordinates } from './location.service.interface';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';
export declare class GPSLocationService implements ILocationService {
    private readonly driversRepository;
    constructor(driversRepository: Repository<Driver>);
    getLocation(driverId: string): Promise<Coordinates | null>;
    validateGeofence(driverId: string, stationId: string): Promise<boolean>;
}
