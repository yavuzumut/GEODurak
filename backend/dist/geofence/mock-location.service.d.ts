import { ILocationService, Coordinates } from './location.service.interface';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Station } from '../stations/station.entity';
export declare class MockLocationService implements ILocationService {
    private readonly redis;
    private readonly stationRepository;
    constructor(redis: Redis, stationRepository: Repository<Station>);
    getLocation(driverId: string): Promise<Coordinates | null>;
    validateGeofence(driverId: string, stationId: string): Promise<boolean>;
}
