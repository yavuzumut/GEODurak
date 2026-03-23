import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';
export declare class DriversService {
    private driversRepository;
    constructor(driversRepository: Repository<Driver>);
    create(driverData: Partial<Driver>): Promise<Driver>;
    findAll(): Promise<Driver[]>;
    findOne(id: string): Promise<Driver | null>;
    findByPhone(phone: string): Promise<Driver | null>;
    updateLocation(driverId: string, latitude: number, longitude: number, stationId?: string): Promise<Driver | null>;
    updateStatus(driverId: string, status: DriverStatus): Promise<Driver | null>;
    clearGeofenceExitTimer(driverId: string): Promise<void>;
    getDriversOutsideGeofenceTooLong(timeoutMs: number): Promise<Driver[]>;
    getAllWithCoordinates(): Promise<any[]>;
}
