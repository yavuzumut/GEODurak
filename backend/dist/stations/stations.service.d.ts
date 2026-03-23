import { Repository } from 'typeorm';
import { Station } from './station.entity';
export declare class StationsService {
    private stationsRepo;
    constructor(stationsRepo: Repository<Station>);
    findAll(): Promise<Station[]>;
    findOne(id: string): Promise<Station | null>;
    create(data: Partial<Station>): Promise<Station>;
    getGeofenceWKT(stationId: string): Promise<string | null>;
}
